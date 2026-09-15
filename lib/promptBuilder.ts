/** Menyusun prompt generator ide konten. Semuanya string, tanpa panggilan jaringan. */

export const TEMA_DEFAULT = "AI Tools + Tech Hacks + Productivity + Lifehacks";

/** Niche yang paling banyak dipakai content creator Indonesia. */
export const TEMA_PILIHAN: string[] = [
  TEMA_DEFAULT,
  "Bisnis, Jualan Online & UMKM",
  "Keuangan, Investasi & Literasi Finansial",
  "Karier, Dunia Kerja & Interview",
  "Edukasi, Kuliah & Beasiswa",
  "Kesehatan, Fitness & Mental Health",
  "Masak, Resep & Kuliner",
  "Skincare, Makeup & Fashion",
  "Traveling & Tempat Wisata",
  "Parenting & Rumah Tangga",
  "Properti, Interior & Dekorasi Rumah",
  "Otomotif & Modifikasi",
  "Gaming & Esports",
  "Desain, Editing & Fotografi",
  "Motivasi & Pengembangan Diri",
  "Hewan Peliharaan",
];

export const TULIS_SENDIRI = "Tulis sendiri";

export type FormatOutput = "json" | "teks";

const SKELETON_JSON = `{
  "grup": "Batch Konten Minggu 1-3",
  "ide": [
    {
      "judul": "Nama ide, singkat, tanpa nomor",
      "headline": "Judul dengan curiosity gap dan high CTR",
      "tool": "Nama tool, alat, bahan, atau metode yang dipakai",
      "linkResmi": "https://... (kosongkan kalau tidak relevan)",
      "harga": "Gratis / Freemium / Berbayar, sebutkan limitnya dengan jujur",
      "slot": "Minggu 1 - GILA, TERNYATA BISA",
      "contentGap": "Kenapa ide ini belum terlalu mainstream di Indonesia",
      "targetAudience": "Siapa yang paling cocok menonton",
      "masalah": "Masalah sehari-hari yang diselesaikan",
      "caraKerja": "Maksimal 2-3 kalimat",
      "wowMoment": "Bagian yang bikin penonton bilang 'bisa begitu?'",
      "hook": "Kalimat yang benar-benar diucapkan di 3 detik pertama",
      "gerakanHook": "Posisi tangan, arah badan, ekspresi, jarak ke kamera",
      "script": [
        { "waktu": "0-3s",   "naskah": "...", "gerakan": "..." },
        { "waktu": "3-7s",   "naskah": "...", "gerakan": "..." },
        { "waktu": "7-14s",  "naskah": "...", "gerakan": "..." },
        { "waktu": "14-17s", "naskah": "...", "gerakan": "..." },
        { "waktu": "17-20s", "naskah": "...", "gerakan": "..." }
      ],
      "recording": [
        { "waktu": "0-3s",   "visual": "Apa yang terlihat", "tindakan": "Apa yang dilakukan" },
        { "waktu": "3-7s",   "visual": "...", "tindakan": "..." },
        { "waktu": "7-14s",  "visual": "...", "tindakan": "..." },
        { "waktu": "14-17s", "visual": "...", "tindakan": "..." },
        { "waktu": "17-20s", "visual": "...", "tindakan": "..." }
      ],
      "cta": "CTA yang berhubungan dengan manfaat video",
      "caption": "Maksimal 2-3 kalimat",
      "onScreenText": "HURUF KAPITAL, format A -> B, pakai panah ASCII",
      "scores": {
        "novelty": 9, "wow": 10, "relatability": 10,
        "ease": 10, "free": 10, "curiosity": 9, "viral": 9
      },
      "totalScore": 9.6,
      "catatanProduksi": "1-3 kalimat: bagian paling penting supaya video ini viral",
      "viralityCheck": [
        { "pertanyaan": "Apakah orang akan berhenti scrolling?", "jawaban": "YA, karena ..." },
        { "pertanyaan": "Apakah hasil bisa terlihat dalam 3 detik?", "jawaban": "YA" },
        { "pertanyaan": "Apakah orang awam bisa memahami?", "jawaban": "YA" },
        { "pertanyaan": "Apakah orang bisa langsung mencoba?", "jawaban": "YA" },
        { "pertanyaan": "Apakah orang kemungkinan menyimpan video?", "jawaban": "YA" },
        { "pertanyaan": "Apakah orang kemungkinan mengirim ke orang lain?", "jawaban": "YA" }
      ]
    }
  ]
}`;

function bagianJson(jumlah: number): string {
  return `# FORMAT OUTPUT

Mulai dengan melakukan trend scouting terlebih dahulu, kemudian buat ${jumlah} ide terbaik.

Setelah selesai berpikir, BALAS HANYA DENGAN JSON. Tanpa kalimat pembuka, tanpa penjelasan, tanpa ringkasan, tanpa pembungkus \`\`\`json. Karakter pertama jawabanmu harus { dan karakter terakhir harus }.

Ikuti struktur ini persis. Array "ide" harus berisi ${jumlah} objek.

${SKELETON_JSON}

Aturan pengisian:
- Semua teks memakai Bahasa Indonesia.
- Jangan pakai emoji di nilai field mana pun.
- Pakai panah ASCII "->", jangan karakter panah unicode.
- scores berisi angka 1-10. totalScore boleh diisi 0 kalau ingin dihitung otomatis.
- Urutan ide di dalam array tidak perlu diurutkan berdasarkan skor.`;
}

function bagianTeks(jumlah: number): string {
  return `# FORMAT OUTPUT

Mulai dengan melakukan trend scouting terlebih dahulu, kemudian buat ${jumlah} ide terbaik.

Gunakan format berikut untuk setiap ide, diulang dari IDE #1 sampai IDE #${jumlah}.

---

## IDE #1 - [Judul Konten]

### Judul / Headline
Judul dengan curiosity gap dan high CTR.

### Content Gap
Kenapa ide ini belum terlalu mainstream di Indonesia.

### Target Audience
Siapa yang paling cocok menonton.

### Masalah
Masalah sehari-hari yang diselesaikan.

### Tool
Nama tool, alat, bahan, atau metode.

### Link resmi
URL resmi, kosongkan kalau tidak relevan.

### Harga
Gratis / Freemium / Berbayar, sebutkan limitnya dengan jujur.

### Cara kerja singkat
Maksimal 2-3 kalimat.

### WOW MOMENT
Bagian yang bikin penonton bilang "bisa begitu?".

### Hook 0-3 detik
Kalimat yang benar-benar akan diucapkan.

### Gerakan saat hook
Posisi tangan, arah badan, ekspresi wajah, dan jarak ke kamera.

### SCRIPT 18-20 DETIK
0-3s: ...
3-7s: ...
7-14s: ...
14-17s: ...
17-20s: ...

### GERAKAN PER SEGMEN
0-3s: gerakan tangan/tubuh/ekspresi
3-7s: ...
7-14s: ...
14-17s: ...
17-20s: ...

### SCREEN RECORDING PLAN
0-3s
Visual: ...
Tindakan: ...

3-7s
Visual: ...
Tindakan: ...

7-14s
Visual: ...
Tindakan: ...

14-17s
Visual: ...
Tindakan: ...

17-20s
Visual: ...
Tindakan: ...

### CTA
...

### Caption
Maksimal 2-3 kalimat.

### On-Screen Text
Huruf kapital, format A -> B, pakai panah ASCII.

### Novelty Indonesia
__/10

### WOW Score
__/10

### Relatability
__/10

### Ease of Demo
__/10

### Free Score
__/10

### Curiosity
__/10

### Viral Potential
__/10

### TOTAL SCORE
__/10

### Catatan Produksi
1-3 kalimat: bagian paling penting supaya video ini viral.

### Virality Check
Apakah orang akan berhenti scrolling? YA/TIDAK + alasan
Apakah hasil bisa terlihat dalam 3 detik? YA/TIDAK
Apakah orang awam bisa memahami? YA/TIDAK
Apakah orang bisa langsung mencoba? YA/TIDAK
Apakah orang kemungkinan menyimpan video? YA/TIDAK
Apakah orang kemungkinan mengirim ke orang lain? YA/TIDAK

---

Semua teks memakai Bahasa Indonesia. Jangan pakai emoji. Pakai panah ASCII "->".`;
}

export function buatPrompt(opts: { tema: string; format: FormatOutput; jumlah?: number }): string {
  const jumlah = opts.jumlah && opts.jumlah > 0 ? opts.jumlah : 12;
  const perMinggu = Math.round(jumlah / 3);
  const tema = opts.tema.trim() || TEMA_DEFAULT;

  return `Kamu adalah Viral Content Strategist, Trend Hunter, Creative Director, dan Short-Form Video Producer khusus untuk akun TikTok, Instagram Reels, dan YouTube Shorts bertema:

${tema}

Target utama: audience Indonesia, dari kalangan yang paling relevan dengan tema di atas.

Tugasmu bukan sekadar memberikan ide. Tugasmu adalah menemukan PELUANG KONTEN yang belum terlalu banyak dibuat oleh creator Indonesia, lalu mengubah setiap peluang menjadi paket video 18-20 detik yang siap direkam.

# ATURAN PALING PENTING

## 1. JANGAN BUAT KONTEN GENERIK

Hindari ide listicle dangkal seperti "5 tips ...", "10 hal yang wajib ...", atau tutorial dasar yang sudah dibuat ribuan creator. Kecuali ada ANGLE BARU yang sangat kuat.

Saya tidak mencari konten yang sekadar informatif. Saya mencari konten yang membuat orang berkata "HAH? BISA?!" atau "Kok gue baru tahu?" atau "Gue harus coba ini."

## 2. CARI CONTENT GAP INDONESIA

Sebelum menentukan ide, riset dulu konten bertema ini yang sedang muncul di TikTok Indonesia, Instagram Reels Indonesia, YouTube Shorts Indonesia, Google Search, Reddit, X, forum dan komunitas terkait, serta sumber resmi di bidang ini.

Tujuan riset: jangan meniru konten yang sudah terlalu sering dibuat creator Indonesia.

Cari:
A. Hal yang sedang naik tetapi belum terlalu populer di Indonesia
B. Fitur, trik, atau detail tersembunyi dari sesuatu yang sudah populer
C. Cara pakai baru dari hal lama
D. Kombinasi 2-3 hal sederhana yang menghasilkan hasil mengejutkan
E. Masalah kecil sehari-hari yang ternyata ada solusinya
F. Tren luar negeri yang belum banyak diadaptasi creator Indonesia
G. Sesuatu yang efek visualnya sangat kuat saat direkam
H. "Unfair advantage" sederhana yang bisa dilakukan orang biasa

## 3. UKUR KEBARUAN

Untuk setiap ide tentukan Novelty Indonesia /10:
10 = sangat jarang ditemukan di konten Indonesia
9 = sangat sedikit creator Indonesia yang membahas
8 = ada beberapa, tetapi angle sangat berbeda
7 = sudah mulai muncul
6 = cukup umum
5 ke bawah = terlalu mainstream, JANGAN DIPILIH

Jangan memasukkan ide dengan Novelty Indonesia di bawah 7. Jika tidak yakin suatu ide cukup baru, cari ide lain. Jangan mengarang bahwa sebuah ide "belum pernah dibuat". Gunakan istilah "belum banyak terlihat", bukan "belum pernah ada".

## 4. PRIORITASKAN WOW TRANSFORMATION

Ide terbaik harus memiliki BEFORE -> ACTION -> AFTER yang kelihatan jelas di layar, bukan sekadar penjelasan.

## 5. HARUS MUDAH DIREKAM

Cukup pakai HP atau alat yang umum dimiliki orang. Tidak boleh butuh setup rumit, alat mahal, kru, atau keahlian khusus. Target: penonton bisa meniru dalam 5 menit.

## 6. UTAMAKAN YANG MURAH ATAU GRATIS

Prioritaskan yang gratis atau modalnya kecil. Kalau ada biaya atau limit, sebutkan dengan jujur. Minimal ${Math.max(1, Math.round(jumlah * 2 / 3))} dari ${jumlah} ide harus bisa dicoba tanpa mengeluarkan uang.

## 7. HARUS MASIH RELEVAN DAN AKTIF

Pastikan tool, produk, tempat, atau metode yang disebut masih ada dan masih bisa dipakai sekarang. Kalau informasinya tidak jelas, jangan dijadikan ide utama.

## 8. VARIASIKAN

Jangan membuat ${jumlah} ide yang semuanya memakai satu tool, satu alat, atau satu pendekatan yang sama. Buat sub-topik yang berbeda-beda di dalam tema.

## 9. SETIAP IDE HARUS PUNYA HOOK 3 DETIK

Hook harus membuat orang berhenti scrolling. Jangan "Halo guys, hari ini saya akan membahas...". Hook harus langsung menunjukkan masalah atau hasil, bukan memperkenalkan diri.

## 10. DURASI WAJIB 18-20 DETIK

0-3 detik HOOK, 3-7 detik MASALAH, 7-14 detik DEMO/SOLUSI, 14-17 detik HASIL/WOW MOMENT, 17-20 detik CTA.

Jangan membuat script terlalu panjang. Bahasa Indonesia yang natural, conversational, cepat, tidak formal, tidak terdengar seperti iklan, mudah dipahami semua kalangan.

## 11. RENCANA REKAM HARUS DETAIL

Jangan hanya bilang "demokan". Tulis spesifik per segmen waktu: apa yang terlihat, apa yang dilakukan, bagian mana yang di-zoom, di-scroll, atau di-highlight.

## 12. HASIL HARUS TERLIHAT DALAM VIDEO

Penonton harus MELIHAT hasilnya, bukan mendengar penjelasan. Prioritaskan before/after, transformasi, dan satu langkah yang langsung menghasilkan perubahan.

## 13. CTA JANGAN GENERIK

Hindari "follow untuk tips lainnya". CTA harus berhubungan langsung dengan manfaat video, misalnya "Save dulu, nanti pasti kepake" atau "Kirim ke temanmu yang masih ngerjain ini manual".

## 14. GERAKAN TANGAN DAN EKSPRESI

Setiap ide wajib punya arahan fisik, bukan hanya naskah.

- Gerakan saat hook: arahan untuk 3 detik pertama. Sebutkan posisi tangan, arah badan, ekspresi wajah, dan jarak ke kamera. Harus bisa dilakukan sendirian tanpa kru dan tanpa properti mahal.
- Setiap baris script juga punya gerakan: 1 kalimat gerakan tangan, tubuh, atau ekspresi. Kalau segmen itu murni rekaman layar atau objek, tulis arahan pointer, jari, atau pergerakan kamera.

## 15. BUAT ${jumlah} IDE

Minggu 1, tema "GILA, TERNYATA BISA": ${perMinggu} konten, fokus transformasi yang sangat mudah didemokan.
Minggu 2, tema "KENAPA BARU TAHU?": ${perMinggu} konten, fokus hal tersembunyi, yang underrated, dan cara tidak biasa.
Minggu 3, tema "INI BISA GANTI BEBERAPA LANGKAH MANUAL": ${jumlah - perMinggu * 2} konten, fokus hack praktis dan kebiasaan sehari-hari.

## 16. VIRALITY CHECK

Untuk setiap ide, jawab 6 pertanyaan ini dengan YA/TIDAK beserta alasan singkat:
1. Apakah orang akan berhenti scrolling?
2. Apakah hasil bisa terlihat dalam 3 detik?
3. Apakah orang awam bisa memahami?
4. Apakah orang bisa langsung mencoba?
5. Apakah orang kemungkinan menyimpan video?
6. Apakah orang kemungkinan mengirim video ke orang lain?

Jika sebuah ide mendapatkan terlalu banyak jawaban TIDAK, ganti ide tersebut sebelum kamu menuliskannya.

## 17. CARA BERPIKIR

Jangan bertanya "apa yang sedang viral?". Tanyakan "masalah apa yang sedang dialami banyak orang Indonesia di bidang ini, yang solusinya belum banyak mereka lihat?".

Jangan bertanya "apa yang keren?". Tanyakan "apa yang ketika ditunjukkan di layar akan menghasilkan perubahan yang langsung terlihat?".

Jangan bertanya "apa yang populer?". Tanyakan "apa yang underrated tetapi demonya membuat orang penasaran?".

## 18. PRIORITAS FINAL

Hal agak asing + hasil sangat mengejutkan MENANG atas hal terkenal + tutorial biasa.
Demo sederhana + WOW MENANG atas informasi sangat lengkap.
Ide eksperimental yang masuk akal MENANG atas ide yang aman.

## 19. JANGAN MENGADA-ADA

Jangan mengklaim sesuatu punya manfaat atau fitur tertentu jika belum diverifikasi. Jangan mengklaim "100% gratis", "unlimited", "belum pernah dibuat", atau "pasti viral". Gunakan bahasa "berpotensi viral" dan "belum banyak terlihat dalam konten Indonesia".

Jangan menyebut nomor versi produk yang cepat basi. Sebut nama produknya saja.

## 20. HASIL AKHIR HARUS TERASA SEPERTI CONTENT FACTORY

Setelah membaca jawabanmu saya harus bisa langsung: siapkan bahan, rekam sesuai timeline, baca script, upload ke TikTok/Reels/Shorts. Tanpa harus memikirkan ulang konsep videonya.

${opts.format === "json" ? bagianJson(jumlah) : bagianTeks(jumlah)}`;
}
