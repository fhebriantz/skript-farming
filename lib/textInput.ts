import { EMPTY_SCORES, hitungTotal, slugify, type Idea, type ScriptLine, type Scores, type ShotLine } from "./types";

/**
 * Parser teks lokal. Tidak memanggil API apa pun.
 * Cara kerjanya: deteksi baris yang berupa label bagian, lalu ambil isi sampai label berikutnya.
 */

const ALIAS: Record<string, string[]> = {
  headline: ["judul / headline", "judul/headline", "judul", "headline"],
  contentGap: ["content gap", "gap konten"],
  targetAudience: ["target audience", "target audiens", "target"],
  masalah: ["masalah", "problem"],
  tool: ["tool", "tools", "aplikasi"],
  linkResmi: ["link resmi", "link", "website"],
  harga: ["harga", "pricing", "biaya"],
  slot: ["minggu", "slot", "week"],
  caraKerja: ["cara kerja singkat", "cara kerja", "how it works"],
  wowMoment: ["wow moment", "wow"],
  hook: ["hook 0-3 detik", "hook 0-3s", "hook"],
  script: ["script 18-20 detik", "script 18-20s", "script", "naskah"],
  recording: ["screen recording plan", "screen recording", "recording plan", "rencana rekam"],
  cta: ["cta", "call to action"],
  caption: ["caption", "keterangan"],
  onScreenText: ["on-screen text", "on screen text", "teks layar"],
  scores: ["scores", "score", "skor", "penilaian"],
  totalScore: ["total score", "skor total"],
  catatanProduksi: ["catatan produksi", "catatan", "production note"],
  gerakanHook: ["gerakan saat hook", "gerakan hook", "gestur hook", "body language"],
};

/** Samakan bentuk label supaya "**Hook 0–3 Detik**" dan "hook 0-3 detik" dianggap sama. */
function normalisasi(baris: string): string {
  return baris
    .replace(/[‐-―−]/g, "-")
    .replace(/[#*_>`]/g, "")
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const PETA = new Map<string, string>();
for (const [kunci, daftar] of Object.entries(ALIAS)) {
  for (const a of daftar) PETA.set(a, kunci);
}

function labelDari(baris: string): { kunci: string; sisa: string } | null {
  const bersihBaris = baris.replace(/[‐-―−]/g, "-");
  const inline = bersihBaris.match(/^\s*(?:#{1,6}\s*|\*{0,2})([^:\n]{2,40}?)\*{0,2}\s*:\s*(\S.*)$/);
  if (inline) {
    const k = PETA.get(normalisasi(inline[1]));
    if (k) return { kunci: k, sisa: inline[2].trim() };
  }
  const k = PETA.get(normalisasi(bersihBaris));
  if (k) return { kunci: k, sisa: "" };
  return null;
}

function bersih(s: string): string {
  return s
    .replace(/\*\*/g, "")
    .replace(/^[\s>*_-]+|[\s>*_-]+$/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function bagiSeksi(blok: string): Record<string, string> {
  const baris = blok.split("\n");
  const hasil: Record<string, string[]> = {};
  let aktif: string | null = null;

  for (const b of baris) {
    const lbl = labelDari(b);
    if (lbl) {
      aktif = lbl.kunci;
      hasil[aktif] ??= [];
      if (lbl.sisa) hasil[aktif].push(lbl.sisa);
      continue;
    }
    if (aktif) hasil[aktif].push(b);
  }

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(hasil)) out[k] = bersih(v.join("\n"));
  return out;
}

function rapikanWaktu(w: string): string {
  return w.replace(/[‐-―−]/g, "-").replace(/\s+/g, "");
}

function parseScript(teks: string): ScriptLine[] {
  const out: ScriptLine[] = [];
  const re = /^\s*[-*|]?\s*(\d+\s*[-‐-―−]\s*\d+\s*s|\d+\s*s)\s*[:.|]\s*(.+?)\s*\|?\s*$/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(teks))) {
    const naskah = bersih(m[2]);
    if (naskah) out.push({ waktu: rapikanWaktu(m[1]), naskah });
  }
  return out;
}

function parseRecording(teks: string): ShotLine[] {
  const out: ShotLine[] = [];
  const blokWaktu = teks.split(/\n(?=\s*\d+\s*[-‐-―−]\s*\d+\s*s\b)/);
  for (const b of blokWaktu) {
    const w = b.match(/^\s*(\d+\s*[-‐-―−]\s*\d+\s*s)/);
    if (!w) continue;
    const visual = b.match(/Visual\s*:\s*(.+)/i)?.[1] ?? "";
    const tindakan = b.match(/Tindakan\s*:\s*(.+)/i)?.[1] ?? "";
    if (visual || tindakan) {
      out.push({ waktu: rapikanWaktu(w[1]), visual: bersih(visual), tindakan: bersih(tindakan) });
    } else {
      const sisa = bersih(b.replace(w[0], "").replace(/^\s*[:.]\s*/, ""));
      if (sisa) out.push({ waktu: rapikanWaktu(w[1]), visual: sisa, tindakan: "" });
    }
  }
  return out;
}

/** Skor dicari per baris supaya kata "Freemium" tidak salah dibaca sebagai "Free". */
function parseScores(teks: string): Scores {
  const s: Scores = { ...EMPTY_SCORES };
  const peta: [keyof Scores, string][] = [
    ["novelty", "novelty(?:\\s+indonesia)?"],
    ["wow", "wow(?:\\s+score)?"],
    ["relatability", "relatabilit\\w*"],
    ["ease", "ease(?:\\s+of\\s+demo)?"],
    ["free", "free(?:\\s+score)?"],
    ["curiosity", "curiosit\\w*"],
    ["viral", "viral(?:\\s+potential)?"],
  ];
  for (const [k, pola] of peta) {
    const re = new RegExp(`^\\s*[-*|]?\\s*\\*{0,2}${pola}\\*{0,2}\\s*[:|]?\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:/\\s*10)?\\s*\\|?\\s*$`, "im");
    const m = teks.match(re);
    if (m) s[k] = Math.min(10, parseFloat(m[1].replace(",", ".")));
  }
  return s;
}

export function parseTeks(blok: string, urutan: number): Idea {
  const seksi = bagiSeksi(blok);

  const judulRaw =
    blok.match(/^\s*(?:#{1,6}\s*)?(?:[^\w\s]*\s*)*(?:IDE|KONTEN|CONTENT|VIDEO)\s*#?\s*\d+\s*[-‐-―−:]*\s*(.+)$/im)?.[1] ??
    blok.split("\n").find((b) => b.trim().length > 3) ??
    `Ide ${urutan}`;
  const judul = bersih(judulRaw).slice(0, 120) || `Ide ${urutan}`;

  const teksSkor = seksi.scores || blok;
  const scores = parseScores(teksSkor);
  const totalMatch = (seksi.totalScore || blok).match(/(\d+(?:[.,]\d+)?)\s*(?:\/\s*10)?/);
  const totalDariTeks = seksi.totalScore && totalMatch ? parseFloat(totalMatch[1].replace(",", ".")) : NaN;
  const totalBlok = blok.match(/TOTAL\s*SCORE[^0-9]{0,20}(\d+(?:[.,]\d+)?)/i);
  const totalScore = !isNaN(totalDariTeks)
    ? totalDariTeks
    : totalBlok
      ? parseFloat(totalBlok[1].replace(",", "."))
      : hitungTotal(scores);

  const hook = seksi.hook || "";
  const script = parseScript(seksi.script || "");

  return {
    id: `${Date.now().toString(36)}-${urutan}-${Math.random().toString(36).slice(2, 7)}`,
    slug: slugify(judul),
    rank: urutan,
    judul,
    headline: seksi.headline || judul,
    tool: seksi.tool || "",
    linkResmi: seksi.linkResmi || "",
    harga: seksi.harga || "",
    slot: seksi.slot || "",
    contentGap: seksi.contentGap || "",
    targetAudience: seksi.targetAudience || "",
    masalah: seksi.masalah || "",
    caraKerja: seksi.caraKerja || "",
    wowMoment: seksi.wowMoment || "",
    hook: hook.split("\n")[0] || "",
    gerakanHook: seksi.gerakanHook || "",
    script: script.length ? script : parseScript(blok),
    recording: parseRecording(seksi.recording || ""),
    cta: seksi.cta || "",
    caption: seksi.caption || "",
    onScreenText: (seksi.onScreenText || "").replace(/[←-⇿]/g, "->"),
    scores,
    totalScore: Math.round(totalScore * 10) / 10,
    catatanProduksi: seksi.catatanProduksi || "",
    viralityCheck: [],
  };
}
