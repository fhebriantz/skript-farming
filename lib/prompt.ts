export const SYSTEM_EKSTRAK = `Kamu asisten produksi konten short-form berbahasa Indonesia.
Tugasmu mengubah catatan ide konten yang mentah/berantakan menjadi satu objek JSON terstruktur.

Aturan:
- Pakai Bahasa Indonesia yang natural dan santai, cocok untuk naskah video 18-20 detik.
- Kalau sebuah informasi sudah ada di teks sumber, PAKAI apa adanya, jangan dikarang ulang.
- Kalau sebuah field kosong di teks sumber, isi dengan rangkuman yang masuk akal dari konteks. Jangan kosongkan.
- script: total durasi 18-20 detik, 4-5 baris, format waktu "0-3s", "3-7s", "7-14s", "14-17s", "17-20s".
- recording: rencana rekam layar per segmen waktu, sejajar dengan script.
- scores: angka 1-10 untuk tiap kriteria. Kalau teks sumber sudah menyebut skor, pakai angka itu.
- totalScore: kalau teks sumber menyebut TOTAL SCORE, pakai angka itu. Kalau tidak, rata-rata dari scores, 1 desimal.
- onScreenText: singkat, huruf kapital, format "A -> B". Pakai tanda panah ASCII "->", jangan karakter panah unicode.
- hook: satu kalimat untuk 3 detik pertama, bikin penasaran.
- catatanProduksi: 1-3 kalimat saran praktis supaya videonya lebih kuat.
- Jangan memakai emoji di nilai field mana pun.`;

export const SCHEMA_IDE = {
  type: "OBJECT",
  properties: {
    judul: { type: "STRING", description: "Nama ide, singkat, tanpa nomor" },
    headline: { type: "STRING", description: "Judul/headline yang dipakai di video" },
    tool: { type: "STRING" },
    linkResmi: { type: "STRING", description: "Nama atau URL situs resmi tool" },
    harga: { type: "STRING", description: "Gratis / Freemium / Premium + catatan singkat" },
    slot: { type: "STRING", description: "Minggu atau tema slot posting, boleh kosong" },
    contentGap: { type: "STRING" },
    targetAudience: { type: "STRING" },
    masalah: { type: "STRING" },
    caraKerja: { type: "STRING" },
    wowMoment: { type: "STRING" },
    hook: { type: "STRING" },
    script: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { waktu: { type: "STRING" }, naskah: { type: "STRING" } },
        required: ["waktu", "naskah"],
      },
    },
    recording: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { waktu: { type: "STRING" }, visual: { type: "STRING" }, tindakan: { type: "STRING" } },
        required: ["waktu", "visual", "tindakan"],
      },
    },
    cta: { type: "STRING" },
    caption: { type: "STRING" },
    onScreenText: { type: "STRING" },
    scores: {
      type: "OBJECT",
      properties: {
        novelty: { type: "NUMBER" },
        wow: { type: "NUMBER" },
        relatability: { type: "NUMBER" },
        ease: { type: "NUMBER" },
        free: { type: "NUMBER" },
        curiosity: { type: "NUMBER" },
        viral: { type: "NUMBER" },
      },
      required: ["novelty", "wow", "relatability", "ease", "free", "curiosity", "viral"],
    },
    totalScore: { type: "NUMBER" },
    catatanProduksi: { type: "STRING" },
  },
  required: [
    "judul", "headline", "tool", "harga", "contentGap", "targetAudience", "masalah",
    "caraKerja", "wowMoment", "hook", "script", "recording", "cta", "caption",
    "onScreenText", "scores", "totalScore", "catatanProduksi",
  ],
} as const;
