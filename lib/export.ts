"use client";

import JSZip from "jszip";
import { bungkus, halamanIde, isiIde, isiIndex, namaFile } from "./docHtml";
import type { Group, Idea } from "./types";

export function unduhFile(nama: string, isi: string, tipe = "text/html;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([isi], { type: tipe }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function unduhIde(ide: Idea, total: number) {
  unduhFile(namaFile(ide), halamanIde(ide, total));
}

/** Berkas di luar halaman ide. Dipakai juga untuk menghitung isi ZIP di label tombol. */
export const BERKAS_TAMBAHAN = ["#0-INDEX.html", "SEMUA-IDE.html", "sumber-asli.txt"] as const;

export const jumlahBerkasZip = (g: Group): number => g.ideas.length + BERKAS_TAMBAHAN.length;

/** Peta nama berkas ke isinya. Murni, tanpa DOM, supaya bisa diuji terpisah. */
export function berkasZip(g: Group): Record<string, string> {
  const out: Record<string, string> = {};
  out[BERKAS_TAMBAHAN[0]] = bungkus(`${g.nama} - Index`, isiIndex(g));
  g.ideas.forEach((i) => (out[namaFile(i)] = halamanIde(i, g.ideas.length)));
  out[BERKAS_TAMBAHAN[1]] = bungkus(
    g.nama,
    [isiIndex(g), ...g.ideas.map((i) => isiIde(i, g.ideas.length))].join(
      '\n<hr style="border:none;border-top:2px solid #333;margin:20pt 0;">\n'
    )
  );
  out[BERKAS_TAMBAHAN[2]] = g.sourceText;
  return out;
}

/** Satu ZIP berisi folder bercap waktu, semua halaman ide, index, gabungan, dan sumber asli. */
export async function unduhZipGrup(g: Group) {
  const zip = new JSZip();
  const folder = zip.folder(g.folder)!;
  for (const [nama, isi] of Object.entries(berkasZip(g))) folder.file(nama, isi);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${g.folder}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copy sebagai rich text supaya ukuran font 14/12/11 ikut terbawa ke Google Docs. */
export async function copyKaya(html: string): Promise<boolean> {
  const polos = html
    .replace(/<\/(p|tr|h\d|div)>/gi, "\n")
    .replace(/<td[^>]*>/gi, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([polos], { type: "text/plain" }),
      }),
    ]);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(polos);
      return true;
    } catch {
      return false;
    }
  }
}
