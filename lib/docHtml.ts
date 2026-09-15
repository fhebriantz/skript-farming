import { SCORE_LABEL, type Group, type Idea, type Scores } from "./types";

/** Ukuran font mengikuti permintaan: judul utama 14, sub judul 12, teks biasa 11 (satuan pt = angka di kotak font size Google Docs). */
export const UK = { h1: "14pt", h2: "12pt", body: "11pt" };
export const FAM = "Arial, Helvetica, sans-serif";

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nl = (s: string) => esc(s).replace(/\n/g, "<br>");

function h1(t: string, pertama = false) {
  return `<p style="font-family:${FAM};font-size:${UK.h1};margin:${pertama ? "0" : "12pt"} 0 5pt 0;"><strong>${esc(t)}</strong></p>`;
}
function h2(t: string) {
  return `<p style="font-family:${FAM};font-size:${UK.h2};margin:10pt 0 5pt 0;"><strong>${esc(t)}</strong></p>`;
}
function p(t: string, extra = "") {
  return `<p style="font-family:${FAM};font-size:${UK.body};margin:0 0 6pt 0;${extra}">${nl(t)}</p>`;
}
function hr() {
  return `<hr style="border:none;border-top:1px solid #ccc;margin:8pt 0;">`;
}
function quote(isi: string[]) {
  return `<div style="border-left:3px solid #999;padding-left:8pt;margin:0 0 8pt 0;">${isi.map((x) => p(x)).join("")}</div>`;
}

const SEL = `border:1px solid #999;padding:3pt 6pt;font-family:${FAM};font-size:${UK.body};`;

function tabel(head: string[], rows: string[][]) {
  if (!rows.length) return "";
  const th = `<tr>${head.map((c) => `<td style="${SEL}background:#f0f0f0;"><strong>${esc(c)}</strong></td>`).join("")}</tr>`;
  const tb = rows
    .map((r) => `<tr>${r.map((c) => `<td style="${SEL}">${nl(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table style="border-collapse:collapse;margin:0 0 8pt 0;width:100%;">${th}${tb}</table>`;
}

function bagian(judul: string, isi: string) {
  if (!isi || !isi.trim()) return "";
  return h2(judul) + p(isi);
}

/** Isi dokumen satu ide (tanpa <html>), siap disisipkan atau di-copy ke Google Docs. */
export function isiIde(ide: Idea, total: number): string {
  const out: string[] = [];
  out.push(h1(`#${ide.rank} — ${ide.judul}`, true));

  const info = [`**TOTAL SCORE: ${ide.totalScore}/10**`.replace(/\*\*/g, "")];
  if (ide.tool) info[0] += ` | Tool: ${ide.tool}`;
  if (ide.slot) info[0] += ` | Slot: ${ide.slot}`;
  info.push(`Ranking: #${ide.rank} dari ${total}`);
  out.push(quote(info));
  out.push(hr());

  out.push(bagian("Judul / Headline", ide.headline));
  out.push(bagian("Content Gap", ide.contentGap));
  out.push(bagian("Target Audience", ide.targetAudience));
  out.push(bagian("Masalah", ide.masalah));

  const infoRows: string[][] = [];
  if (ide.tool) infoRows.push(["Tool", ide.tool]);
  if (ide.linkResmi) infoRows.push(["Link resmi", ide.linkResmi]);
  if (ide.harga) infoRows.push(["Harga", ide.harga]);
  if (infoRows.length) out.push(h2("Tool & Link Resmi") + tabel(["Item", "Detail"], infoRows));

  out.push(bagian("Cara Kerja Singkat", ide.caraKerja));
  out.push(bagian("WOW Moment", ide.wowMoment));

  if (ide.hook) out.push(h2("Hook 0-3 Detik") + quote([ide.hook]));

  if (ide.script.length) {
    out.push(h2("Script 18-20 Detik"));
    out.push(tabel(["Waktu", "Naskah"], ide.script.map((s) => [s.waktu, s.naskah])));
  }
  if (ide.recording.length) {
    out.push(h2("Screen Recording Plan"));
    out.push(tabel(["Waktu", "Visual", "Tindakan"], ide.recording.map((s) => [s.waktu, s.visual, s.tindakan])));
  }

  out.push(bagian("CTA", ide.cta));
  out.push(bagian("Caption", ide.caption));
  if (ide.onScreenText) out.push(h2("On-Screen Text") + p(ide.onScreenText));

  const sk = Object.entries(ide.scores)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([k, v]) => [SCORE_LABEL[k as keyof Scores] ?? k, `${v}/10`]);
  if (sk.length) {
    sk.push(["TOTAL", `${ide.totalScore}/10`]);
    out.push(h2("Scoring") + tabel(["Kriteria", "Skor"], sk));
  }

  out.push(bagian("Catatan Produksi", ide.catatanProduksi));
  return out.filter(Boolean).join("\n");
}

export function halamanIde(ide: Idea, total: number): string {
  return bungkus(`#${ide.rank} - ${ide.judul}`, isiIde(ide, total));
}

export function isiIndex(g: Group): string {
  const out: string[] = [];
  out.push(h1(`${g.nama}`, true));
  out.push(quote([`Folder: ${g.tanggal}`, `${g.ideas.length} ide konten, diurutkan dari skor terbesar ke terkecil.`]));
  out.push(hr());
  out.push(h2("Ranking Lengkap"));
  out.push(
    tabel(
      ["#", "Judul", "Tool", "Skor", "File"],
      g.ideas.map((i) => [String(i.rank), i.judul, i.tool || "-", `${i.totalScore}`, `#${i.rank}-${i.slug}.html`])
    )
  );
  const perTool = new Map<string, string[]>();
  g.ideas.forEach((i) => {
    const k = i.harga || "Tidak disebutkan";
    perTool.set(k, [...(perTool.get(k) ?? []), i.tool || i.judul]);
  });
  out.push(h2("Ringkasan Status Harga"));
  out.push(tabel(["Status", "Tool"], Array.from(perTool, ([k, v]) => [k, v.join(", ")])));
  return out.join("\n");
}

export function bungkus(judul: string, isi: string): string {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(judul)}</title></head><body style="font-family:${FAM};font-size:${UK.body};color:#000;max-width:800px;margin:20px auto;padding:0 16px;">
${isi}
</body></html>`;
}

export function namaFile(ide: Idea): string {
  return `#${ide.rank}-${ide.slug}.html`;
}
