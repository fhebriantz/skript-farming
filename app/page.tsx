"use client";

import { useMemo, useState } from "react";
import { Bilah } from "@/components/Bilah";
import { Pratinjau } from "@/components/Pratinjau";
import { cobaBacaJson } from "@/lib/jsonInput";
import { parseTeks } from "@/lib/textInput";
import { pisahBlok } from "@/lib/split";
import { bungkus, isiIde, isiIndex, namaFile } from "@/lib/docHtml";
import { copyKaya, unduhFile, unduhIde, unduhZipGrup } from "@/lib/export";
import type { Group, Idea } from "@/lib/types";

const hariIni = () => new Date().toISOString().slice(0, 10);
type Mode = "json" | "teks";

const CONTOH_JSON = `{
  "grup": "Batch Konten AI",
  "tanggal": "${hariIni()}",
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
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState(hariIni());
  const [mode, setMode] = useState<Mode>("json");
  const [lihatFormat, setLihatFormat] = useState(false);
  const [galat, setGalat] = useState("");
  const [peringatan, setPeringatan] = useState("");
  const [status, setStatus] = useState("");

  // Hasil hanya hidup di memori. Tidak ada yang ditulis ke disk, cookie, atau penyimpanan browser.
  const [grup, setGrup] = useState<Group | null>(null);
  const [pilih, setPilih] = useState<Idea | null>(null);

  const json = useMemo(() => cobaBacaJson(teks), [teks]);
  const blok = useMemo(() => (json ? [] : pisahBlok(teks)), [teks, json]);

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
    setPeringatan("");
    if (!teks.trim()) return setGalat("Inputnya masih kosong.");

    if (json) {
      const ideas = urutkan(json.ideas);
      setGrup({
        id: "memori",
        tanggal: json.tanggal || tanggal,
        nama: nama.trim() || json.nama || `JSON ${ideas.length} ide`,
        createdAt: Date.now(),
        sourceText: teks,
        ideas,
        meta: { source: "json" },
      });
      return;
    }

    if (mode === "json") {
      return setGalat("Ini bukan JSON yang dikenali. Cek formatnya, atau pindah ke tab Teks mentah.");
    }
    if (!blok.length) return setGalat("Tidak ada ide yang terdeteksi dari teks ini.");

    const ideas = urutkan(blok.map((b, i) => parseTeks(b, i + 1)));
    const kosong = ideas.filter((i) => !i.tool && !i.hook && !i.script.length).length;
    setGrup({
      id: "memori",
      tanggal,
      nama: nama.trim() || `Teks ${ideas.length} ide`,
      createdAt: Date.now(),
      sourceText: teks,
      ideas,
      meta: { source: "teks" },
    });
    if (kosong) {
      setPeringatan(
        `${kosong} ide hampir kosong karena labelnya tidak dikenali. Parser teks mengandalkan label seperti "Tool", "Harga", "Hook", "SCRIPT". Untuk hasil paling lengkap, pakai mode JSON.`
      );
    }
  }

  function mulaiBaru() {
    setGrup(null);
    setPilih(null);
    setGalat("");
    setPeringatan("");
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
              <button onClick={() => unduhIde(pilih, grup.ideas.length)} className="tombol">
                Unduh {namaFile(pilih)}
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

        <div className="mb-4 flex items-center justify-between gap-3">
          {sebelum ? (
            <button onClick={() => setPilih(sebelum)} className="tombol">
              &larr; #{sebelum.rank} {sebelum.judul.slice(0, 28)}
            </button>
          ) : (
            <span />
          )}
          {sesudah ? (
            <button onClick={() => setPilih(sesudah)} className="tombol">
              #{sesudah.rank} {sesudah.judul.slice(0, 28)} &rarr;
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
                Unduh ZIP ({grup.ideas.length + 2} file)
              </button>
            </>
          }
        />

        <div className="kartu mb-4 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">folder {grup.tanggal}</p>
            <h1 className="text-xl font-semibold text-white">{grup.nama}</h1>
          </div>
          <dl className="flex flex-wrap gap-6 text-sm">
            <div>
              <dt className="text-muted">Ide</dt>
              <dd className="font-semibold text-white">{grup.ideas.length}</dd>
            </div>
            <div>
              <dt className="text-muted">Sumber</dt>
              <dd className="font-semibold text-white">{grup.meta.source === "teks" ? "teks mentah" : "JSON"}</dd>
            </div>
          </dl>
        </div>

        <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          Hasil ini hanya ada di halaman yang sedang terbuka dan tidak disimpan di mana pun. Unduh ZIP-nya sebelum
          menutup atau me-refresh halaman.
        </p>

        {status && <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">{status}</p>}
        {peringatan && (
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">{peringatan}</p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Halaman ide</h2>
            <div className="space-y-2">
              {grup.ideas.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setPilih(i)}
                  className="flex w-full items-center gap-4 rounded-lg border border-line bg-panel p-4 text-left transition hover:border-accent"
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
        <section className="kartu p-5">
          <div className="mb-4 inline-flex rounded-lg border border-line bg-[#0f1219] p-1">
            {([["json", "JSON"], ["teks", "Teks mentah"]] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  mode === m ? "bg-accent text-white" : "text-muted hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "json" ? (
            <>
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
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-line bg-[#0f1219] p-3 text-[11px] leading-relaxed text-slate-300">
                  {CONTOH_JSON}
                </pre>
              )}
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white">Paste teks mentah</h1>
              <p className="mt-1 text-sm text-muted">
                Dibaca parser lokal berdasarkan label seperti <code className="rounded bg-white/5 px-1">Tool</code>,{" "}
                <code className="rounded bg-white/5 px-1">Harga</code>,{" "}
                <code className="rounded bg-white/5 px-1">Hook</code>,{" "}
                <code className="rounded bg-white/5 px-1">SCRIPT</code>. Untuk hasil paling lengkap, pakai mode JSON.
              </p>
            </>
          )}

          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            placeholder={
              mode === "json"
                ? '{\n  "grup": "Batch Konten AI",\n  "ide": [ { "judul": "...", "tool": "...", "hook": "..." } ]\n}'
                : "IDE #1 - Foto Struk jadi Excel\nTool: ...\nHook: Jangan ketik struk ini ke Excel...\n\nIDE #2 - Hapus objek foto\nTool: ...\n..."
            }
            className="mt-4 h-80 w-full resize-y rounded-lg border border-line bg-[#0f1219] p-4 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 focus:border-accent"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded-md px-2 py-1 ${
                json
                  ? "bg-emerald-500/15 text-emerald-300"
                  : blok.length
                    ? "bg-accent/15 text-accent"
                    : "bg-white/5 text-muted"
              }`}
            >
              {json
                ? `JSON terbaca - ${json.ideas.length} ide`
                : blok.length
                  ? `Terdeteksi ${blok.length} ide`
                  : "Belum ada ide terdeteksi"}
            </span>
            <span className="text-muted">{teks.length.toLocaleString("id-ID")} karakter</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted">Nama grup</span>
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Batch Minggu 1"
                className="w-full rounded-lg border border-line bg-[#0f1219] px-3 py-2 text-slate-200 outline-none focus:border-accent"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Folder tanggal</span>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-line bg-[#0f1219] px-3 py-2 text-slate-200 outline-none focus:border-accent"
              />
            </label>
          </div>

          <button onClick={generate} disabled={!json && !blok.length} className="tombol-utama mt-5">
            {json ? `Generate ${json.ideas.length} halaman` : `Generate ${blok.length || ""} halaman`}
          </button>

          {galat && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{galat}</p>}
        </section>
      </div>
    </>
  );
}
