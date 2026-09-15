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

/** Satu ZIP berisi folder tanggal + semua halaman ide + index. */
export async function unduhZipGrup(g: Group) {
  const zip = new JSZip();
  const folder = zip.folder(g.tanggal)!;
  folder.file("#0-INDEX.html", bungkus(`${g.nama} - Index`, isiIndex(g)));
  g.ideas.forEach((i) => folder.file(namaFile(i), halamanIde(i, g.ideas.length)));
  folder.file(
    "SEMUA-IDE.html",
    bungkus(
      g.nama,
      [isiIndex(g), ...g.ideas.map((i) => isiIde(i, g.ideas.length))].join(
        '\n<hr style="border:none;border-top:2px solid #333;margin:20pt 0;">\n'
      )
    )
  );
  folder.file("sumber-asli.txt", g.sourceText);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${g.tanggal}-${g.nama.replace(/[^\w-]+/g, "-").toLowerCase()}.zip`;
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
