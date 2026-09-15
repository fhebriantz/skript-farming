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
- gerakanHook: arahan fisik konkret untuk 3 detik pertama. Sebutkan posisi tangan, arah badan,
  ekspresi wajah, dan jarak ke kamera. Contoh: "Angkat struk ke depan kamera dengan tangan kanan,
  kibaskan sekali, lalu tarik turun cepat sambil geleng kepala kecil dan alis naik."
  Harus bisa dilakukan sambil merekam layar HP, jangan menuntut kru atau properti mahal.
- script[].gerakan: gerakan tangan/tubuh/ekspresi singkat untuk tiap segmen waktu, 1 kalimat.
  Kalau segmen itu murni screen recording tanpa badan terlihat, tulis arahan pointer/jari di layar.
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
    gerakanHook: { type: "STRING", description: "Gerakan tangan, posisi badan, dan ekspresi untuk 3 detik pertama" },
    script: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          waktu: { type: "STRING" },
          naskah: { type: "STRING" },
          gerakan: { type: "STRING", description: "Gerakan tangan/tubuh/ekspresi saat baris ini diucapkan" },
        },
        required: ["waktu", "naskah", "gerakan"],
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
    "caraKerja", "wowMoment", "hook", "gerakanHook", "script", "recording", "cta", "caption",
    "onScreenText", "scores", "totalScore", "catatanProduksi",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Mode otomatis: cari peluang konten sendiri, lalu susun 12 ide       */
/* ------------------------------------------------------------------ */

export const SYSTEM_STRATEGIST = `Kamu Viral Content Strategist, Trend Hunter, Creative Director, dan Short-Form Video Producer
untuk akun TikTok / Instagram Reels / YouTube Shorts bertema: AI Tools + Tech Hacks + Productivity + Lifehacks.
Audience: Indonesia - pekerja kantoran, mahasiswa, pelajar, freelancer, UMKM, content creator pemula,
ibu rumah tangga, masyarakat umum.

Tugasmu bukan memberi daftar ide biasa. Tugasmu menemukan PELUANG KONTEN yang belum banyak dibuat
creator Indonesia, lalu mengubahnya jadi paket video 18-20 detik yang siap direkam pakai screen recording HP/laptop.

JANGAN BUAT IDE GENERIK. Hindari "5 AI gratis untuk produktivitas", "10 AI wajib dicoba",
"AI untuk bikin CV", "AI untuk bikin presentasi", "cara pakai ChatGPT", "AI merangkum PDF",
kecuali ada angle baru yang sangat kuat. Target reaksi penonton: "HAH? BISA?!" atau "Kok gue baru tahu?".

CARI CONTENT GAP dari kategori berikut:
A. Tool yang sedang naik tapi belum populer di Indonesia
B. Fitur tersembunyi dari tool populer
C. Use case baru dari tool lama
D. Kombinasi 2-3 tool gratis yang menghasilkan workflow mengejutkan
E. Masalah kecil sehari-hari yang ternyata bisa diselesaikan AI
F. Tren luar negeri yang belum banyak diadaptasi creator Indonesia
G. Tool baru dengan efek visual sangat kuat
H. "Unfair advantage" sederhana yang bisa dilakukan orang biasa

ATURAN WAJIB:
1. Novelty Indonesia minimal 7/10. Kalau ragu sebuah ide cukup baru, ganti ide lain.
2. Setiap ide harus punya BEFORE -> ACTION -> AFTER yang kelihatan di layar, bukan sekadar penjelasan.
3. Harus bisa direkam dengan screen recording biasa: buka web, upload/paste, klik, hasil.
   Tidak boleh butuh coding, API, server, setup rumit, software mahal, atau PC high-end.
   Penonton harus bisa meniru dalam 5 menit.
4. Minimal 8 dari 12 ide harus gratis atau freemium dengan free tier yang benar-benar berguna.
   Sebutkan limit gratisnya dengan jujur. Hindari tool yang hasil terbaiknya terkunci paywall.
5. Tool harus masih aktif dan fiturnya benar-benar ada. Kalau tidak yakin, jangan dijadikan ide.
6. Jangan semua ide memakai ChatGPT. Variasikan kategori: AI document, image, video, search,
   productivity, spreadsheet, OCR, voice, presentation, design, automation, browser AI, mobile AI.
7. Hook 3 detik harus langsung menunjukkan masalah atau hasil. Dilarang "Halo guys, hari ini...".
8. Durasi 18-20 detik: 0-3s hook, 3-7s masalah, 7-14s demo, 14-17s hasil, 17-20s CTA.
   Bahasa Indonesia natural, conversational, cepat, tidak formal, tidak terdengar seperti iklan.
9. CTA jangan generik. Bukan "follow untuk tips lainnya", tapi terkait manfaat videonya.
10. Jangan menyebut nomor versi model AI yang cepat basi (mis. "GPT-4o", "Claude 3.5 Sonnet").
    Sebut nama produknya saja.
11. JANGAN MENGADA-ADA. Dilarang mengklaim "100% gratis", "unlimited", "belum pernah ada", "pasti viral".
    Pakai "gratis/freemium", "belum banyak terlihat dalam konten Indonesia", "berpotensi viral".

Kalau harus memilih: tool agak asing + hasil mengejutkan MENANG atas tool terkenal + tutorial biasa.
Demo sederhana + WOW MENANG atas informasi lengkap. Ide eksperimental masuk akal MENANG atas ide aman.`;

export const SCHEMA_KONSEP = {
  type: "OBJECT",
  properties: {
    risetTren: {
      type: "STRING",
      description: "Ringkasan singkat hasil penelusuran peluang konten, 2-4 kalimat",
    },
    konsep: {
      type: "ARRAY",
      description: "Tepat 4 konsep ide konten untuk minggu yang diminta",
      items: {
        type: "OBJECT",
        properties: {
          judul: { type: "STRING" },
          tool: { type: "STRING" },
          kategoriTool: { type: "STRING", description: "mis. AI OCR, AI video, AI spreadsheet" },
          angle: { type: "STRING", description: "Angle yang membuat ide ini tidak generik, 1-2 kalimat" },
          transformasi: { type: "STRING", description: "Format BEFORE -> ACTION -> AFTER" },
          harga: { type: "STRING", description: "Gratis / Freemium / Trial + limit jujurnya" },
          minggu: { type: "NUMBER", description: "1, 2, atau 3" },
          tema: { type: "STRING", description: "Tema minggu tersebut" },
          noveltyIndonesia: { type: "NUMBER", description: "7-10" },
        },
        required: ["judul", "tool", "kategoriTool", "angle", "transformasi", "harga", "minggu", "tema", "noveltyIndonesia"],
      },
    },
  },
  required: ["risetTren", "konsep"],
} as const;

export const TEMA_MINGGU: Record<number, { tema: string; fokus: string }> = {
  1: { tema: "GILA, TERNYATA BISA", fokus: "transformasi yang sangat mudah didemokan dan hasilnya langsung kelihatan" },
  2: { tema: "KENAPA BARU TAHU?", fokus: "hidden feature, tool underrated, dan workflow yang tidak biasa" },
  3: { tema: "INI BISA GANTI BEBERAPA LANGKAH MANUAL", fokus: "productivity hack dan workflow sehari-hari" },
};

/**
 * Scouting dipecah per minggu (4 konsep sekali panggil) supaya tiap request selesai jauh
 * di bawah batas 60 detik Vercel, dan supaya model tetap boleh berpikir panjang.
 */
export function promptScouting(minggu: number, hindariTool: string[], tema?: string): string {
  const m = TEMA_MINGGU[minggu] ?? TEMA_MINGGU[1];
  const larangan = hindariTool.length
    ? `\n\nTool berikut SUDAH dipakai di minggu lain, jangan dipakai lagi dan jangan pakai tool yang fungsinya nyaris sama:\n${hindariTool.map((t) => `- ${t}`).join("\n")}`
    : "";
  const arahan = tema ? `\n\nArahan tambahan dari user: ${tema.slice(0, 600)}` : "";
  return `Lakukan trend scouting lebih dulu, lalu susun TEPAT 4 konsep ide konten untuk MINGGU ${minggu}.

Tema minggu ${minggu}: "${m.tema}"
Fokus: ${m.fokus}

Keempat konsep harus memakai 4 tool berbeda dengan kategori berbeda.
Minimal 3 dari 4 gratis atau freemium dengan free tier yang benar-benar berguna.
Setiap konsep wajib punya noveltyIndonesia minimal 7.
Isi field minggu dengan ${minggu} dan field tema dengan "${m.tema}".${larangan}${arahan}`;
}

export function promptDariKonsep(k: Record<string, unknown>): string {
  return `Susun paket video 18-20 detik yang siap direkam dari konsep berikut.
Isi SEMUA field sesuai skema, termasuk arahan gerakan tangan dan ekspresi.

Judul      : ${k.judul}
Tool       : ${k.tool} (${k.kategoriTool})
Harga      : ${k.harga}
Angle      : ${k.angle}
Transformasi: ${k.transformasi}
Slot       : Minggu ${k.minggu} - ${k.tema}
Novelty Indonesia: ${k.noveltyIndonesia}/10

Pakai angka novelty di atas untuk scores.novelty. Skor lain nilai sendiri secara jujur 1-10.
Jangan mengarang fitur yang belum tentu ada pada tool tersebut.`;
}
