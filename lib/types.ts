export type ScriptLine = { waktu: string; naskah: string };
export type ShotLine = { waktu: string; visual: string; tindakan: string };

export type Scores = {
  novelty: number;
  wow: number;
  relatability: number;
  ease: number;
  free: number;
  curiosity: number;
  viral: number;
};

export const SCORE_LABEL: Record<keyof Scores, string> = {
  novelty: "Novelty Indonesia",
  wow: "WOW Score",
  relatability: "Relatability",
  ease: "Ease of Demo",
  free: "Free Score",
  curiosity: "Curiosity",
  viral: "Viral Potential",
};

export type Idea = {
  id: string;
  slug: string;
  rank: number;
  judul: string;
  headline: string;
  tool: string;
  linkResmi: string;
  harga: string;
  slot: string;
  contentGap: string;
  targetAudience: string;
  masalah: string;
  caraKerja: string;
  wowMoment: string;
  hook: string;
  script: ScriptLine[];
  recording: ShotLine[];
  cta: string;
  caption: string;
  onScreenText: string;
  scores: Scores;
  totalScore: number;
  catatanProduksi: string;
};

export type GroupMeta = {
  model: string;
  source: "gemini" | "heuristik";
  tokensIn: number;
  tokensOut: number;
  calls: number;
  durasiMs: number;
};

export type Group = {
  id: string;
  tanggal: string; // YYYY-MM-DD -> dipakai sebagai nama folder
  nama: string;
  createdAt: number;
  sourceText: string;
  ideas: Idea[];
  meta: GroupMeta;
};

export const EMPTY_SCORES: Scores = {
  novelty: 0,
  wow: 0,
  relatability: 0,
  ease: 0,
  free: 0,
  curiosity: 0,
  viral: 0,
};

export function hitungTotal(s: Scores): number {
  const v = Object.values(s).filter((n) => typeof n === "number" && n > 0);
  if (!v.length) return 0;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
}

export function slugify(t: string): string {
  return (
    t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "ide"
  );
}
