import { NextResponse } from "next/server";
import { panggilGemini, GeminiHabis } from "@/lib/gemini";
import { SCHEMA_IDE, SYSTEM_EKSTRAK, SYSTEM_STRATEGIST, promptDariKonsep } from "@/lib/prompt";
import { ekstrakHeuristik } from "@/lib/fallback";
import { EMPTY_SCORES, hitungTotal, slugify, type Idea } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function rapikan(mentah: any, urutan: number, cadangan: string): Idea {
  const scores = { ...EMPTY_SCORES, ...(mentah?.scores ?? {}) };
  const judul = String(mentah?.judul || `Ide ${urutan}`).replace(/^#?\s*\d+\s*[-–—:.]\s*/, "").trim();
  const total = Number(mentah?.totalScore) > 0 ? Number(mentah.totalScore) : hitungTotal(scores);
  const teks = (v: any) => (typeof v === "string" ? v.trim() : "");

  return {
    id: `${Date.now().toString(36)}-${urutan}-${Math.random().toString(36).slice(2, 7)}`,
    slug: slugify(judul),
    rank: urutan,
    judul,
    headline: teks(mentah?.headline) || judul,
    tool: teks(mentah?.tool),
    linkResmi: teks(mentah?.linkResmi),
    harga: teks(mentah?.harga),
    slot: teks(mentah?.slot),
    contentGap: teks(mentah?.contentGap),
    targetAudience: teks(mentah?.targetAudience),
    masalah: teks(mentah?.masalah),
    caraKerja: teks(mentah?.caraKerja),
    wowMoment: teks(mentah?.wowMoment),
    hook: teks(mentah?.hook),
    gerakanHook: teks(mentah?.gerakanHook),
    script: Array.isArray(mentah?.script)
      ? mentah.script
          .map((s: any) => ({ waktu: teks(s?.waktu), naskah: teks(s?.naskah), gerakan: teks(s?.gerakan) }))
          .filter((s: any) => s.naskah)
      : [],
    recording: Array.isArray(mentah?.recording)
      ? mentah.recording
          .map((s: any) => ({ waktu: teks(s?.waktu), visual: teks(s?.visual), tindakan: teks(s?.tindakan) }))
          .filter((s: any) => s.visual || s.tindakan)
      : [],
    cta: teks(mentah?.cta),
    caption: teks(mentah?.caption),
    onScreenText: teks(mentah?.onScreenText).replace(/[←-⇿]/g, "->"),
    scores,
    totalScore: Math.round(total * 10) / 10,
    catatanProduksi: teks(mentah?.catatanProduksi) || cadangan,
    viralityCheck: [],
  };
}

export async function POST(req: Request) {
  let body: { blok?: string; urutan?: number; konsep?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON yang valid." }, { status: 400 });
  }

  const urutan = Number(body.urutan) || 1;
  const konsep = body.konsep;
  const blok = (body.blok ?? "").trim();

  // Dua mode: manual (ekstrak dari teks yang dipaste) dan otomatis (kembangkan dari konsep).
  const otomatis = Boolean(konsep && typeof konsep === "object");
  if (!otomatis && !blok) return NextResponse.json({ error: "Teks ide kosong." }, { status: 400 });

  try {
    const hasil = await panggilGemini({
      systemInstruction: otomatis
        ? `${SYSTEM_STRATEGIST}\n\n${SYSTEM_EKSTRAK}`
        : SYSTEM_EKSTRAK,
      prompt: otomatis
        ? promptDariKonsep(konsep!)
        : `Ini catatan mentah satu ide konten. Ubah jadi JSON terstruktur sesuai skema.\n\n---\n${blok.slice(0, 20000)}\n---`,
      schema: SCHEMA_IDE as unknown as Record<string, unknown>,
      maxOutputTokens: 8192,
      temperature: otomatis ? 0.7 : 0.35,
    });

    return NextResponse.json({
      ide: rapikan(hasil.data, urutan, ""),
      model: hasil.model,
      source: "gemini",
      mode: otomatis ? "otomatis" : "manual",
      tokensIn: hasil.tokensIn,
      tokensOut: hasil.tokensOut,
    });
  } catch (e) {
    const pesan = e instanceof GeminiHabis ? e.message : (e as Error).message;
    // Mode otomatis tidak punya teks sumber, jadi tidak ada yang bisa diparsing lokal.
    if (otomatis) {
      return NextResponse.json({ error: `Gemini tidak bisa dipakai. ${pesan}` }, { status: 503 });
    }
    // Cadangan tanpa API supaya pekerjaan tidak berhenti total saat kuota habis.
    const ide = ekstrakHeuristik(blok, urutan);
    return NextResponse.json({
      ide,
      model: "-",
      source: "heuristik",
      tokensIn: 0,
      tokensOut: 0,
      peringatan: `Gemini tidak bisa dipakai (${pesan}). Ide ini diekstrak dengan parser lokal, hasilnya lebih mentah.`,
    });
  }
}
