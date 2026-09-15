import { EMPTY_SCORES, hitungTotal, slugify, type CekViral, type Idea, type Scores } from "./types";

/**
 * Parser JSON. Kalau teks yang dipaste berbentuk JSON yang dikenali, semua field dipetakan
 * langsung di browser tanpa server dan tanpa panggilan jaringan apa pun.
 */

export type HasilJson = {
  ideas: Idea[];
  nama?: string;
  tanggal?: string;
};

/**
 * Model chat sering menyisipkan penanda sitasi seperti "([India Today][1])" dan tautan
 * markdown "[teks](url)". Dibersihkan supaya tidak ikut tercetak mentah di dokumen.
 */
function bersihkanTeks(v: string): string {
  return v
    .replace(/\s*\(\[[^\]]*\]\[\d+\]\)/g, "") // ([Nama][1])
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, "$1") // [teks](url) -> teks
    .replace(/\s*\[\d+\](?=[\s.,;:)]|$)/g, "") // sisa penanda [1]
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Khusus field tautan: yang diambil URL-nya, bukan teksnya. */
function bersihkanTautan(v: string): string {
  const md = v.trim().match(/^\[[^\]]*\]\((https?:[^)\s]+)\)$/);
  return md ? md[1] : bersihkanTeks(v);
}

const str = (v: unknown): string =>
  typeof v === "string" ? bersihkanTeks(v) : typeof v === "number" ? String(v) : "";

const angka = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

function bacaScores(v: any): Scores {
  const s: Scores = { ...EMPTY_SCORES };
  if (!v || typeof v !== "object") return s;
  const alias: Record<keyof Scores, string[]> = {
    novelty: ["novelty", "noveltyIndonesia", "novelty_indonesia"],
    wow: ["wow", "wowScore", "wow_score"],
    relatability: ["relatability", "relatabilitas"],
    ease: ["ease", "easeOfDemo", "ease_of_demo"],
    free: ["free", "freeScore", "free_score"],
    curiosity: ["curiosity", "curiositas"],
    viral: ["viral", "viralPotential", "viral_potential"],
  };
  for (const [kunci, nama] of Object.entries(alias) as [keyof Scores, string[]][]) {
    for (const n of nama) {
      if (v[n] !== undefined) {
        s[kunci] = Math.min(10, angka(v[n]));
        break;
      }
    }
  }
  return s;
}

function bacaCekViral(v: any): CekViral[] {
  if (Array.isArray(v)) {
    return v
      .map((x: any) => ({ pertanyaan: str(x?.pertanyaan ?? x?.question), jawaban: str(x?.jawaban ?? x?.answer) }))
      .filter((x) => x.pertanyaan && x.jawaban);
  }
  // Bentuk objek: { "Apakah orang berhenti scrolling?": "YA, karena ..." }
  if (v && typeof v === "object") {
    return Object.entries(v)
      .map(([pertanyaan, jawaban]) => ({ pertanyaan, jawaban: str(jawaban) }))
      .filter((x) => x.jawaban);
  }
  return [];
}

function keIde(m: any, urutan: number): Idea {
  const judul = str(m?.judul ?? m?.title ?? m?.nama).replace(/^#?\s*\d+\s*[-–—:.]\s*/, "") || `Ide ${urutan}`;
  const scores = bacaScores(m?.scores ?? m);
  const total = angka(m?.totalScore ?? m?.total_score ?? m?.total) || hitungTotal(scores);

  const script = Array.isArray(m?.script)
    ? m.script
        .map((s: any) => ({ waktu: str(s?.waktu ?? s?.time), naskah: str(s?.naskah ?? s?.text), gerakan: str(s?.gerakan ?? s?.movement) }))
        .filter((s: any) => s.naskah)
    : [];

  const recording = Array.isArray(m?.recording ?? m?.screenRecording)
    ? (m.recording ?? m.screenRecording)
        .map((s: any) => ({ waktu: str(s?.waktu ?? s?.time), visual: str(s?.visual), tindakan: str(s?.tindakan ?? s?.action) }))
        .filter((s: any) => s.visual || s.tindakan)
    : [];

  return {
    id: `${Date.now().toString(36)}-${urutan}-${Math.random().toString(36).slice(2, 7)}`,
    slug: slugify(judul),
    rank: urutan,
    judul,
    headline: str(m?.headline) || judul,
    tool: str(m?.tool),
    linkResmi: bersihkanTautan(String(m?.linkResmi ?? m?.link ?? m?.url ?? "")),
    harga: str(m?.harga ?? m?.price),
    slot: str(m?.slot ?? m?.minggu ?? m?.week),
    contentGap: str(m?.contentGap ?? m?.content_gap),
    targetAudience: str(m?.targetAudience ?? m?.target_audience ?? m?.target),
    masalah: str(m?.masalah ?? m?.problem),
    caraKerja: str(m?.caraKerja ?? m?.cara_kerja ?? m?.howItWorks),
    wowMoment: str(m?.wowMoment ?? m?.wow_moment),
    hook: str(m?.hook),
    gerakanHook: str(m?.gerakanHook ?? m?.gerakan_hook ?? m?.bodyLanguage),
    script,
    recording,
    cta: str(m?.cta),
    caption: str(m?.caption),
    onScreenText: str(m?.onScreenText ?? m?.on_screen_text).replace(/[←-⇿]/g, "->"),
    scores,
    totalScore: Math.round(total * 10) / 10,
    catatanProduksi: str(m?.catatanProduksi ?? m?.catatan ?? m?.productionNote),
    viralityCheck: bacaCekViral(m?.viralityCheck ?? m?.virality_check ?? m?.cekViral),
  };
}

/**
 * Ambil satu blok JSON utuh dari dalam teks.
 * Model chat sering menambahkan kalimat pembuka, pembungkus ```json, atau daftar referensi
 * di bawah JSON. Blok dicari dengan menghitung kurung, dan tanda kurung di dalam string diabaikan.
 */
function petikJson(teks: string): string | null {
  const t = teks.replace(/^\s*```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const mulai = Math.min(
    ...[t.indexOf("{"), t.indexOf("[")].filter((i) => i >= 0).concat(Infinity)
  );
  if (!Number.isFinite(mulai)) return null;

  const buka = t[mulai];
  const tutup = buka === "{" ? "}" : "]";
  let dalam = 0;
  let diString = false;
  let escape = false;

  for (let i = mulai; i < t.length; i++) {
    const c = t[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      if (diString) escape = true;
      continue;
    }
    if (c === '"') {
      diString = !diString;
      continue;
    }
    if (diString) continue;
    if (c === buka) dalam++;
    else if (c === tutup) {
      dalam--;
      if (dalam === 0) return t.slice(mulai, i + 1);
    }
  }
  return null;
}

/** Kembalikan null kalau teks bukan JSON yang dikenali. */
export function cobaBacaJson(teks: string): HasilJson | null {
  const potongan = petikJson(teks);
  if (!potongan) return null;

  let data: any;
  try {
    data = JSON.parse(potongan);
  } catch {
    return null;
  }

  const daftar = Array.isArray(data) ? data : data?.ide ?? data?.ideas ?? data?.konten ?? data?.items;
  if (!Array.isArray(daftar) || !daftar.length) return null;

  // Harus benar-benar berbentuk ide konten, bukan JSON acak.
  const layak = daftar.filter((x) => x && typeof x === "object" && (x.judul || x.title || x.hook || x.tool));
  if (!layak.length) return null;

  return {
    ideas: layak.map((x, i) => keIde(x, i + 1)),
    nama: Array.isArray(data) ? undefined : str(data?.grup ?? data?.nama ?? data?.group) || undefined,
    tanggal: Array.isArray(data) ? undefined : str(data?.tanggal ?? data?.date) || undefined,
  };
}

/** Berapa ide yang terdeteksi, dipakai untuk badge di halaman input. */
export function hitungJson(teks: string): number {
  return cobaBacaJson(teks)?.ideas.length ?? 0;
}
