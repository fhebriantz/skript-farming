# Script Farming

Tempel ide konten, langsung jadi halaman siap baca dan file HTML siap copy ke Google Docs,
dikelompokkan dalam folder tanggal.

Ukuran font hasil export mengikuti kebutuhan Google Docs:
**judul utama 14, sub judul 12, teks biasa 11**.

Tidak ada API, tidak ada kunci rahasia, tidak ada database, tidak ada login, tidak ada penyimpanan.
Semua pemrosesan terjadi di browser, dan hasilnya hanya hidup selama halaman terbuka.
Situsnya terbuka untuk siapa saja.

---

## Input

Satu-satunya input adalah JSON. Bentuk yang diterima:

```json
{
  "grup": "Batch Konten AI",
  "ide": [ { "judul": "...", "tool": "...", "hook": "..." } ]
}
```

`grup` opsional, dipakai sebagai judul di dokumen index. Kalau dikosongkan, dipakai
`"12 ide konten"`. Nama folder dan nama berkas ZIP dibuat otomatis dari tanggal dan jam
saat generate, jadi tidak ada yang perlu diisi manual.

Selain kunci `ide`, diterima juga `ideas`, `konten`, `items`, atau array telanjang `[ ... ]`.

- Contoh JSON valid: `contoh/format-12-ide.json`
- Prompt siap pakai untuk menghasilkan JSON itu: `contoh/prompt-generator.md`

Field per ide: `judul`, `headline`, `tool`, `linkResmi`, `harga`, `slot`, `contentGap`,
`targetAudience`, `masalah`, `caraKerja`, `wowMoment`, `hook`, `gerakanHook`, `script[]`,
`recording[]`, `cta`, `caption`, `onScreenText`, `scores`, `totalScore`, `catatanProduksi`,
`viralityCheck[]`.

Field yang dikosongkan tidak membuat parsing gagal, bagiannya hanya tidak muncul di dokumen.
`totalScore` boleh diisi `0`, nanti dihitung dari rata-rata `scores`.

Ide diurutkan otomatis dari skor terbesar ke terkecil lalu dinomori ulang `#1` sampai `#12`.

## Export

Tombol **Unduh ZIP** menghasilkan struktur folder yang sebenarnya. Nama berkasnya
`YYYY-MM-DD-HHmm.zip`, mengikuti tanggal dan jam saat digenerate:

```
2026-09-15-1407/
├── #0-INDEX.html
├── #1-judul-ide.html
├── #2-judul-ide.html
├── ...
├── SEMUA-IDE.html      (semua ide dalam satu file)
└── sumber-asli.txt
```

Tombol **Copy ke Docs** menyalin sebagai rich text, jadi ukuran font 14/12/11 ikut terbawa
saat dipaste ke Google Docs dan tabelnya tetap jadi tabel asli.

## Tidak ada penyimpanan

Hasil generate hanya ada di memori halaman. Refresh atau tutup tab, hasilnya hilang.
Tidak ada IndexedDB, tidak ada localStorage, tidak ada cookie, dan tidak ada apa pun yang
dikirim ke server. Cara menyimpan hasil cuma satu: **Unduh ZIP**.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel

```bash
npm i -g vercel
vercel
```

Tidak ada environment variable yang perlu diisi sama sekali.

## Struktur

```
app/
└── page.tsx        satu halaman: paste JSON -> daftar ide -> detail ide
lib/
├── jsonInput.ts    parser JSON
├── docHtml.ts      render HTML 14/12/11 siap Google Docs
├── export.ts       unduh file, ZIP, copy rich text
└── types.ts
contoh/
├── prompt-generator.md   prompt siap pakai, output JSON
└── format-12-ide.json    contoh JSON valid
```
