/**
 * Pisahkan satu paste besar menjadi beberapa blok ide.
 * Dikerjakan lokal tanpa API supaya hemat kuota; AI hanya dipakai untuk mengekstrak isi tiap blok.
 */

const EMOJI = "[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{FE0F}\\u{2190}-\\u{21FF}]";
const AWALAN = `^\\s*(?:#{1,6}\\s*)?(?:${EMOJI}\\s*)*`;

/** Diuji satu per satu, bukan digabung, supaya baris seperti "SCRIPT 18-20 DETIK" tidak salah dianggap penanda. */
const PENANDA: RegExp[] = [
  new RegExp(`${AWALAN}IDE\\s*#?\\s*(\\d+)\\b`, "iu"),
  new RegExp(`${AWALAN}(?:KONTEN|CONTENT|VIDEO|SCRIPT|IDEA)\\s*#\\s*(\\d+)\\b`, "iu"),
  new RegExp(`${AWALAN}#\\s*(\\d+)\\s*[-–—:.]\\s*\\S`, "u"),
  new RegExp(`^\\s*#{1,6}\\s+(?:${EMOJI}\\s*)*(\\d+)[.)]\\s+\\S`, "u"),
  new RegExp(`^\\s*(\\d+)[.)]\\s+\\S.{10,}$`, "u"),
];

type Kandidat = { idx: number[]; nomor: number[] };

function cari(baris: string[], re: RegExp): Kandidat {
  const idx: number[] = [];
  const nomor: number[] = [];
  baris.forEach((b, i) => {
    const m = b.match(re);
    if (m) {
      idx.push(i);
      nomor.push(parseInt(m[1] ?? "0", 10) || 0);
    }
  });
  return { idx, nomor };
}

/** Penanda yang benar biasanya bernomor naik dan tidak berulang. */
function masukAkal(k: Kandidat): boolean {
  if (k.idx.length < 2) return false;
  const unik = new Set(k.nomor).size === k.nomor.length;
  let naik = true;
  for (let i = 1; i < k.nomor.length; i++) if (k.nomor[i] <= k.nomor[i - 1]) naik = false;
  return unik && naik;
}

function potong(baris: string[], idx: number[]): string[] {
  const blok: string[] = [];
  for (let i = 0; i < idx.length; i++) {
    const akhir = i + 1 < idx.length ? idx[i + 1] : baris.length;
    const isi = baris.slice(idx[i], akhir).join("\n").trim();
    if (isi.length > 40) blok.push(isi);
  }
  return blok;
}

export function pisahBlok(teks: string): string[] {
  const baris = teks.replace(/\r\n/g, "\n").split("\n");

  // 1. Penanda bernomor yang rapi (IDE #1, IDE #2, ...)
  for (const re of PENANDA) {
    const k = cari(baris, re);
    if (masukAkal(k)) {
      const blok = potong(baris, k.idx);
      if (blok.length >= 2) return blok;
    }
  }

  // 2. Penanda bernomor yang tidak rapi, asalkan muncul minimal 2 kali
  for (const re of PENANDA) {
    const k = cari(baris, re);
    if (k.idx.length >= 2) {
      const blok = potong(baris, k.idx);
      if (blok.length >= 2) return blok;
    }
  }

  // 3. Cadangan: potong pada separator horizontal (---, ===, ___)
  const bySep = teks
    .split(/\n\s*(?:-{3,}|={3,}|_{3,})\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 120);
  if (bySep.length >= 2) return bySep;

  const trimmed = teks.trim();
  return trimmed ? [trimmed] : [];
}
