
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export type HasilGemini = {
  data: unknown;
  model: string;
  tokensIn: number;
  tokensOut: number;
};

/**
 * Model yang kena 429 dicatat dan dilewati sampai jendela cooldown habis.
 * Vercel serverless tidak punya state permanen, jadi catatan ini hanya berlaku
 * selama instance masih hangat. Penghematan kuota yang sebenarnya ada di cache sisi klien.
 */
const cooldown = new Map<string, number>();
const COOLDOWN_MS = 1000 * 60 * 30;

function rantaiModel(): string[] {
  const utama = (process.env.GEMINI_MODEL || "gemini-3.6-flash").trim();
  const cadangan = (process.env.GEMINI_FALLBACKS || "gemini-3.5-flash,gemini-2.5-flash,gemini-2.5-flash-lite")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return Array.from(new Set([utama, ...cadangan]));
}

function sedangCooldown(model: string): boolean {
  const sampai = cooldown.get(model);
  if (!sampai) return false;
  if (Date.now() > sampai) {
    cooldown.delete(model);
    return false;
  }
  return true;
}

const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class GeminiHabis extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "GeminiHabis";
  }
}

export async function panggilGemini(opts: {
  systemInstruction: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<HasilGemini> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiHabis("GEMINI_API_KEY belum diisi di environment.");

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: opts.schema,
      temperature: opts.temperature ?? 0.35,
      maxOutputTokens: opts.maxOutputTokens ?? 16384,
    },
  });

  const semua = rantaiModel();
  const tersedia = semua.filter((m) => !sedangCooldown(m));
  const urutan = tersedia.length ? tersedia : semua;
  let errTerakhir = "";

  for (const model of urutan) {
    for (let percobaan = 0; percobaan < 3; percobaan++) {
      let res: Response;
      try {
        res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      } catch (e) {
        errTerakhir = `${model}: jaringan gagal (${(e as Error).message})`;
        await tidur(500 * (percobaan + 1));
        continue;
      }

      if (res.status === 429) {
        cooldown.set(model, Date.now() + COOLDOWN_MS);
        errTerakhir = `${model}: kuota habis (429)`;
        break; // langsung pindah model
      }

      if (res.status >= 500) {
        errTerakhir = `${model}: server error ${res.status}`;
        await tidur(600 * Math.pow(2, percobaan)); // backoff
        continue;
      }

      if (!res.ok) {
        errTerakhir = `${model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`;
        break;
      }

      const json = (await res.json()) as any;
      const teks: string | undefined = json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .filter(Boolean)
        .join("");

      if (!teks) {
        errTerakhir = `${model}: respons kosong (${json?.candidates?.[0]?.finishReason ?? "?"})`;
        break;
      }

      try {
        return {
          data: JSON.parse(teks),
          model,
          tokensIn: json?.usageMetadata?.promptTokenCount ?? 0,
          tokensOut: json?.usageMetadata?.candidatesTokenCount ?? 0,
        };
      } catch {
        errTerakhir = `${model}: JSON tidak valid`;
        break;
      }
    }
  }

  throw new GeminiHabis(errTerakhir || "Semua model Gemini gagal dipanggil.");
}
