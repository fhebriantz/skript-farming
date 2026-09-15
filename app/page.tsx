"use client";

import { useMemo, useState } from "react";
import { Bilah } from "@/components/Bilah";
import { Pratinjau } from "@/components/Pratinjau";
import { cobaBacaJson } from "@/lib/jsonInput";
import { bungkus, isiIde, isiIndex, namaFile } from "@/lib/docHtml";
import { copyKaya, jumlahBerkasZip, unduhFile, unduhIde, unduhZipGrup } from "@/lib/export";
import { capWaktu, type Group, type Idea } from "@/lib/types";
import {
  NICHE_DEFAULT,
  NICHE_PILIHAN,
  TULIS_SENDIRI,
  buatPrompt,
  type FormatOutput,
} from "@/lib/promptBuilder";


const CONTOH_JSON = `{
  "grup": "Batch Konten AI",
  "ide": [
    {
      "judul": "", "headline": "", "tool": "", "linkResmi": "", "harga": "",
      "slot": "Minggu 1 - GILA, TERNYATA BISA",
      "contentGap": "", "targetAudience": "", "masalah": "",
      "caraKerja": "", "wowMoment": "",
      "hook": "", "gerakanHook": "",
      "script": [
        { "waktu": "0-3s",   "naskah": "", "gerakan": "" },
        { "waktu": "3-7s",   "naskah": "", "gerakan": "" },
        { "waktu": "7-14s",  "naskah": "", "gerakan": "" },
        { "waktu": "14-17s", "naskah": "", "gerakan": "" },
        { "waktu": "17-20s", "naskah": "", "gerakan": "" }
      ],
      "recording": [
        { "waktu": "0-3s", "visual": "", "tindakan": "" }
      ],
      "cta": "", "caption": "", "onScreenText": "A -> B",
      "scores": { "novelty": 0, "wow": 0, "relatability": 0,
                  "ease": 0, "free": 0, "curiosity": 0, "viral": 0 },
      "totalScore": 0, "catatanProduksi": "",
      "viralityCheck": [
        { "pertanyaan": "Apakah orang berhenti scrolling?", "jawaban": "YA, karena ..." }
      ]
    }
  ]
}`;

export default function Halaman() {
  const [teks, setTeks] = useState("");
  const [lihatFormat, setLihatFormat] = useState(false);
  const [tab, setTab] = useState<"paste" | "prompt">("paste");
  const [nichePilih, setTemaPilih] = useState(NICHE_DEFAULT);
  const [nicheSendiri, setTemaSendiri] = useState("");
  const [formatOut, setFormatOut] = useState<FormatOutput>("json");
  const [galat, setGalat] = useState("");
  const [status, setStatus] = useState("");

  // Hasil hanya hidup di memori. Tidak ada yang ditulis ke disk, cookie, atau penyimpanan browser.
  const [grup, setGrup] = useState<Group | null>(null);
  const [pilih, setPilih] = useState<Idea | null>(null);

  const json = useMemo(() => cobaBacaJson(teks), [teks]);

  const nicheFinal =
    nichePilih === TULIS_SENDIRI
      ? nicheSendiri
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .join(" + ")
      : nichePilih;

  const prompt = useMemo(
    () => buatPrompt({ niche: nicheFinal || NICHE_DEFAULT, format: formatOut }),
    [nicheFinal, formatOut]
  );

  function lapor(pesan: string) {
    setStatus(pesan);
    setTimeout(() => setStatus(""), 2500);
  }

  function urutkan(list: Idea[]): Idea[] {
    return [...list]
      .sort((a, b) => b.totalScore - a.totalScore || (b.scores?.viral ?? 0) - (a.scores?.viral ?? 0))
      .map((x, n) => ({ ...x, rank: n + 1 }));
  }

  function generate() {
    setGalat("");
    if (!teks.trim()) return setGalat("Inputnya masih kosong.");
    if (!json) return setGalat("Ini bukan JSON yang dikenali. Cek formatnya lewat tombol Lihat format JSON.");

    const ideas = urutkan(json.ideas);
    setGrup({
      id: "memori",
      folder: capWaktu(),
      nama: json.nama || `${ideas.length} ide konten`,
      createdAt: Date.now(),
      sourceText: teks,
      ideas,
    });
  }

  function mulaiBaru() {
    setGrup(null);
    setPilih(null);
    setGalat("");
  }

  /* ---------------------------------------------------------------- */
  /* Tampilan satu ide                                                 */
  /* ---------------------------------------------------------------- */
  if (grup && pilih) {
    const html = isiIde(pilih, grup.ideas.length);
    const posisi = grup.ideas.findIndex((i) => i.id === pilih.id);
    const sebelum = grup.ideas[posisi - 1];
    const sesudah = grup.ideas[posisi + 1];

    return (
      <>
        <Bilah
          kanan={
            <>
              <button onClick={() => setPilih(null)} className="tombol">
                Kembali ke daftar
              </button>
              <button
                onClick={() => unduhIde(pilih, grup.ideas.length)}
                title={`Unduh ${namaFile(pilih)}`}
                className="tombol"
              >
                Unduh HTML
              </button>
              <button
                onClick={async () => lapor((await copyKaya(html)) ? "Tersalin. Paste ke Google Docs." : "Gagal menyalin.")}
                className="tombol-utama"
              >
                Copy ke Docs
              </button>
            </>
          }
        />
        {status && <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">{status}</p>}

        <div className="mb-4 grid grid-cols-2 gap-2">
          {sebelum ? (
            <button onClick={() => setPilih(sebelum)} className="tombol min-w-0 !justify-start">
              <span className="shrink-0">&larr; #{sebelum.rank}</span>
              <span className="truncate">{sebelum.judul}</span>
            </button>
          ) : (
            <span />
          )}
          {sesudah ? (
            <button onClick={() => setPilih(sesudah)} className="tombol col-start-2 min-w-0 !justify-end">
              <span className="truncate">{sesudah.judul}</span>
              <span className="shrink-0">#{sesudah.rank} &rarr;</span>
            </button>
          ) : (
            <span />
          )}
        </div>

        <Pratinjau html={html} />
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Tampilan daftar ide                                               */
  /* ---------------------------------------------------------------- */
  if (grup) {
    const indexHtml = isiIndex(grup);
    return (
      <>
        <Bilah
          kanan={
            <>
              <button onClick={mulaiBaru} className="tombol">
                Input baru
              </button>
              <button
                onClick={async () => lapor((await copyKaya(indexHtml)) ? "Index tersalin." : "Gagal menyalin.")}
                className="tombol"
              >
                Copy index
              </button>
              <button onClick={() => unduhFile("#0-INDEX.html", bungkus(grup.nama, indexHtml))} className="tombol">
                Unduh index
              </button>
              <button onClick={() => unduhZipGrup(grup)} className="tombol-utama">
                Unduh ZIP ({jumlahBerkasZip(grup)} file)
              </button>
            </>
          }
        />

        <div className="kartu mb-4 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs uppercase tracking-wider text-muted">{grup.folder}.zip</p>
            <h1 className="truncate text-lg font-semibold text-white sm:text-xl">{grup.nama}</h1>
          </div>
          <span className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-300">
            {grup.ideas.length} ide
          </span>
        </div>

        <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          Hasil ini hanya ada di halaman yang sedang terbuka dan tidak disimpan di mana pun. Unduh ZIP-nya sebelum
          menutup atau me-refresh halaman.
        </p>

        {status && <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">{status}</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Halaman ide</h2>
            <div className="space-y-2">
              {grup.ideas.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setPilih(i)}
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-panel p-3 text-left transition hover:border-accent sm:gap-4 sm:p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-sm font-bold text-accent">
                    {i.rank}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-100">{i.judul}</span>
                    <span className="block truncate text-xs text-muted">
                      {[i.tool, i.harga].filter(Boolean).join(" · ") || "tanpa tool"}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-md bg-accent/15 px-2 py-1 text-sm font-semibold text-accent">
                    {i.totalScore}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Pratinjau index (14 / 12 / 11)</h2>
            <Pratinjau html={indexHtml} />
          </section>
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Tampilan input                                                    */
  /* ---------------------------------------------------------------- */
  return (
    <>
      <Bilah />

      <div className="mx-auto max-w-3xl">
        <div className="mb-4 inline-flex rounded-lg border border-line bg-[#0f1219] p-1">
          {([["paste", "Paste JSON"], ["prompt", "Buat Prompt"]] as ["paste" | "prompt", string][]).map(
            ([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  tab === t ? "bg-accent text-white" : "text-muted hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {tab === "prompt" ? (
          <section className="kartu p-4 sm:p-5">
            <h1 className="text-lg font-semibold text-white">Buat prompt generator ide</h1>
            <p className="mt-1 text-sm text-muted">
              Pilih niche dan format, lalu copy promptnya. Jalankan di chat AI mana pun, lalu paste hasilnya di tab
              Paste JSON.
            </p>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block text-muted">Niche</span>
              <select
                value={nichePilih}
                onChange={(e) => setTemaPilih(e.target.value)}
                className="w-full rounded-lg border border-line bg-[#0f1219] px-3 py-2 text-slate-200 outline-none focus:border-accent"
              >
                {NICHE_PILIHAN.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value={TULIS_SENDIRI}>{TULIS_SENDIRI}...</option>
              </select>
            </label>

            {nichePilih === TULIS_SENDIRI && (
              <label className="mt-3 block text-sm">
                <span className="mb-1 block text-muted">Niche sendiri, pisahkan dengan koma</span>
                <input
                  value={nicheSendiri}
                  onChange={(e) => setTemaSendiri(e.target.value)}
                  placeholder="Skincare, Parenting, Investasi"
                  className="w-full rounded-lg border border-line bg-[#0f1219] px-3 py-2 text-slate-200 outline-none placeholder:text-slate-600 focus:border-accent"
                />
                <span className="mt-1 block text-xs text-muted">
                  Hasil: <span className="text-slate-300">{nicheFinal || "(masih kosong)"}</span>
                </span>
              </label>
            )}

            <div className="mt-4">
              <span className="mb-1 block text-sm text-muted">Format output</span>
              <div className="inline-flex rounded-lg border border-line bg-[#0f1219] p-1">
                {([["json", "JSON"], ["teks", "Teks"]] as [FormatOutput, string][]).map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setFormatOut(f)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                      formatOut === f ? "bg-accent text-white" : "text-muted hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                {formatOut === "json"
                  ? "JSON bisa langsung dipaste ke tab Paste JSON untuk jadi halaman."
                  : "Teks untuk dibaca manual. Tidak bisa dipaste ke tab Paste JSON."}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(prompt);
                    lapor("Prompt tersalin. Paste ke chat AI.");
                  } catch {
                    lapor("Gagal menyalin.");
                  }
                }}
                className="tombol-utama flex-1 sm:flex-none"
              >
                Copy prompt
              </button>
              <button
                onClick={() =>
                  unduhFile(`prompt-${formatOut}-${capWaktu()}.md`, prompt, "text/markdown;charset=utf-8")
                }
                className="tombol flex-1 sm:flex-none"
              >
                Unduh .md
              </button>
              <span className="self-center text-xs text-muted">
                {prompt.length.toLocaleString("id-ID")} karakter
              </span>
            </div>

            {status && (
              <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">{status}</p>
            )}

            <pre className="mt-4 max-h-[300px] overflow-auto rounded-lg border border-line bg-[#0f1219] p-3 text-[11px] leading-relaxed text-slate-300 sm:max-h-[420px] sm:p-4">
              {prompt}
            </pre>
          </section>
        ) : (
        <section className="kartu p-4 sm:p-5">
          <h1 className="text-lg font-semibold text-white">Paste JSON ide konten</h1>
          <p className="mt-1 text-sm text-muted">
            Semua field dipetakan langsung dan diproses{" "}
            <strong className="text-slate-200">sepenuhnya di browser</strong>. Tidak ada yang dikirim ke server dan
            tidak ada yang disimpan.
          </p>
          <button onClick={() => setLihatFormat((v) => !v)} className="tombol mt-3 text-xs">
            {lihatFormat ? "Sembunyikan format" : "Lihat format JSON"}
          </button>
          {lihatFormat && (
            <pre className="mt-3 max-h-52 overflow-auto rounded-lg border border-line bg-[#0f1219] p-3 text-[11px] leading-relaxed text-slate-300 sm:max-h-64">
              {CONTOH_JSON}
            </pre>
          )}

          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            placeholder={'{\n  "grup": "Batch Konten AI",\n  "ide": [ { "judul": "...", "tool": "...", "hook": "..." } ]\n}'}
            className="mt-4 h-56 w-full resize-y rounded-lg border border-line bg-[#0f1219] p-3 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 focus:border-accent sm:h-80 sm:p-4"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded-md px-2 py-1 ${
                json ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-muted"
              }`}
            >
              {json ? `JSON terbaca - ${json.ideas.length} ide` : "Belum ada JSON yang terbaca"}
            </span>
            <span className="text-muted">{teks.length.toLocaleString("id-ID")} karakter</span>
          </div>

          <button onClick={generate} disabled={!json} className="tombol-utama mt-5 w-full sm:w-auto">
            {json ? `Generate ${json.ideas.length} halaman` : "Generate halaman"}
          </button>

          {galat && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{galat}</p>}
        </section>
        )}
      </div>
    </>
  );
}
