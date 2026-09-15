# Script Farming

Tempel satu blok berisi banyak ide konten sekaligus. Aplikasi memisahkan tiap ide,
merapikannya dengan Gemini, lalu membuat satu halaman + satu file HTML per ide,
dikelompokkan dalam folder tanggal.

Ukuran font hasil export mengikuti kebutuhan Google Docs: **judul utama 14, sub judul 12, teks biasa 11**.

---

## Cara kerja

1. **Pisah lokal.** Teks dipecah jadi beberapa blok ide tanpa memanggil API (deteksi `IDE #1`,
   `## 2) ...`, `#3 - ...`, atau separator `---`). Ini menghemat kuota: API hanya dipakai
   untuk merapikan isi, bukan untuk memisahkan.
2. **Ekstrak per ide.** Tiap blok dikirim ke `/api/parse` secara paralel (maksimal 3 sekaligus).
   Satu request = satu ide, jadi tidak ada request yang menabrak batas 60 detik Vercel.
3. **Urutkan.** Hasil diurutkan dari skor terbesar ke terkecil lalu dinomori ulang.
4. **Simpan & export.** Grup disimpan di IndexedDB browser. Bisa dibuka sebagai halaman,
   di-copy ke Google Docs, atau diunduh sebagai ZIP berisi folder tanggal.

## Ketahanan kuota Gemini

| Lapis | Perilaku |
|---|---|
| Rantai model | `GEMINI_MODEL` lalu `GEMINI_FALLBACKS` dicoba berurutan |
| HTTP 429 | Model ditandai dan dilewati 30 menit, langsung pindah ke model berikutnya |
| HTTP 5xx | Diulang 3x dengan backoff eksponensial |
| Semua model gagal | Jatuh ke parser heuristik lokal tanpa API, hasil tetap keluar (ditandai "parser lokal") |
| Cache | Paste yang sama persis diambil dari IndexedDB, nol request API |

Pemakaian token dicatat per grup dan ditampilkan di halaman folder.

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local   # isi GEMINI_API_KEY
npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel

```bash
npm i -g vercel
vercel
```

Lalu set environment variable di dashboard Vercel (Settings -> Environment Variables):

| Nama | Wajib | Contoh |
|---|---|---|
| `GEMINI_API_KEY` | ya | `AQ.Ab8...` |
| `GEMINI_MODEL` | tidak | `gemini-3.6-flash` |
| `GEMINI_FALLBACKS` | tidak | `gemini-3.5-flash,gemini-2.5-flash,gemini-2.5-flash-lite` |

Tidak ada database, tidak ada penulisan file di server, tidak ada dependensi eksternal lain,
jadi aplikasi ini jalan apa adanya di Vercel (termasuk paket Hobby).

### Kenapa penyimpanan ada di browser

Serverless Vercel tidak punya filesystem permanen, jadi "folder tanggal" tidak bisa jadi folder
sungguhan di server. Grup disimpan di IndexedDB browser, dan tombol **Unduh ZIP** menghasilkan
struktur folder yang sebenarnya di komputer:

```
2026-09-15/
├── #0-INDEX.html
├── #1-judul-ide.html
├── #2-judul-ide.html
├── ...
├── SEMUA-IDE.html      (semua ide dalam satu file)
└── sumber-asli.txt
```

Konsekuensinya: data tidak otomatis ikut pindah antar browser atau perangkat. Kalau nanti butuh
itu, tinggal ganti `lib/store.ts` dengan Vercel KV atau Postgres tanpa mengubah bagian lain.

## Struktur

```
app/
├── page.tsx                    input + daftar folder
├── g/[groupId]/page.tsx        isi satu folder tanggal
├── g/[groupId]/[ideaId]/page.tsx   satu halaman ide
└── api/parse/route.ts          ekstraksi satu ide via Gemini
lib/
├── split.ts        pisah paste jadi beberapa ide (lokal, tanpa API)
├── gemini.ts       rantai model, cooldown 429, backoff 5xx
├── prompt.ts       system instruction + schema JSON
├── fallback.ts     parser heuristik tanpa API
├── docHtml.ts      render HTML 14/12/11 siap Google Docs
├── store.ts        IndexedDB (grup + cache)
└── export.ts       unduh file, ZIP, copy rich text
```
