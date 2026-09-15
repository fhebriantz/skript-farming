"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bilah } from "@/components/Bilah";
import { pisahBlok } from "@/lib/split";
import { cobaBacaJson } from "@/lib/jsonInput";
import { hashText } from "@/lib/hash";
import { ambilCache, hapusGrup, semuaGrup, simpanCache, simpanGrup } from "@/lib/store";
import { bacaBackup, unduhBackup } from "@/lib/export";
import type { Group, Idea } from "@/lib/types";

const hariIni = () => new Date().toISOString().slice(0, 10);

type Progres = { selesai: number; total: number; pesan: string };
type Mode = "json" | "teks";

export default function Halaman() {
  const router = useRouter();
  const [teks, setTeks] = useState("");
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState(hariIni());
  const [jalan, setJalan] = useState(false);
  const [progres, setProgres] = useState<Progres | null>(null);
  const [galat, setGalat] = useState("");
  const [peringatan, setPeringatan] = useState("");
  const [grup, setGrup] = useState<Group[]>([]);
  const [infoBackup, setInfoBackup] = useState("");
  const [mode, setMode] = useState<Mode>("json");
  const [lihatFormat, setLihatFormat] = useState(false);

  useEffect(() => {
    semuaGrup().then(setGrup).catch(() => {});
  }, []);

  const json = useMemo(() => cobaBacaJson(teks), [teks]);
  const blok = useMemo(() => (json ? [] : pisahBlok(teks)), [teks, json]);

  async function generate() {
    setGalat("");
    setPeringatan("");
    if (!teks.trim()) return setGalat("Teksnya masih kosong.");

    // Jalur JSON: semua field dipetakan langsung, nol panggilan API.
    if (json) {
      const ideas = [...json.ideas]
        .sort((a, b) => b.totalScore - a.totalScore || (b.scores?.viral ?? 0) - (a.scores?.viral ?? 0))
        .map((x, n) => ({ ...x, rank: n + 1 }));
      const g: Group = {
        id: `${json.tanggal || tanggal}-${Date.now().toString(36)}`,
        tanggal: json.tanggal || tanggal,
        nama: nama.trim() || json.nama || `JSON ${ideas.length} ide`,
        createdAt: Date.now(),
        sourceText: teks,
        ideas,
        meta: { model: "-", source: "json", tokensIn: 0, tokensOut: 0, calls: 0, durasiMs: 0 },
      };
      await simpanGrup(g);
      router.push(`/g/${g.id}`);
      return;
    }

    if (mode === "json") return setGalat("Ini bukan JSON yang dikenali. Cek formatnya, atau pindah ke tab Teks mentah.");
    if (!blok.length) return setGalat("Tidak ada ide yang terdeteksi dari teks ini.");

    setJalan(true);
    setProgres({ selesai: 0, total: blok.length, pesan: "Menyiapkan..." });
    const mulai = Date.now();

    try {
      const kunci = await hashText(teks);
      const cache = await ambilCache<Idea[]>("parse:" + kunci);
      let ideas: Idea[];
      let model = "cache";
      let source: "gemini" | "heuristik" = "gemini";
      let tokensIn = 0;
      let tokensOut = 0;
      let calls = 0;
      const catatan: string[] = [];

      if (cache && cache.length) {
        ideas = cache;
        setProgres({ selesai: blok.length, total: blok.length, pesan: "Diambil dari cache, kuota API tidak terpakai." });
      } else {
        const hasil: Idea[] = new Array(blok.length);
        let selesai = 0;
        const BATAS = 3; // batasi paralel supaya tidak kena rate limit
        let cursor = 0;

        async function pekerja() {
          while (cursor < blok.length) {
            const i = cursor++;
            setProgres({ selesai, total: blok.length, pesan: `Memproses ide ${i + 1}...` });
            const res = await fetch("/api/parse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ blok: blok[i], urutan: i + 1 }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j?.error || `Gagal memproses ide ${i + 1}`);
            hasil[i] = j.ide;
            calls++;
            tokensIn += j.tokensIn || 0;
            tokensOut += j.tokensOut || 0;
            if (j.model && j.model !== "-") model = j.model;
            if (j.source === "heuristik") source = "heuristik";
            if (j.peringatan && !catatan.includes(j.peringatan)) catatan.push(j.peringatan);
            selesai++;
            setProgres({ selesai, total: blok.length, pesan: `Selesai ${selesai}/${blok.length}` });
          }
        }

        await Promise.all(Array.from({ length: Math.min(BATAS, blok.length) }, pekerja));
        ideas = hasil.filter(Boolean);
        await simpanCache("parse:" + kunci, ideas).catch(() => {});
      }

      // Urutkan dari skor terbesar ke terkecil, lalu nomori ulang.
      ideas = [...ideas]
        .sort((a, b) => b.totalScore - a.totalScore || (b.scores?.viral ?? 0) - (a.scores?.viral ?? 0))
        .map((i, n) => ({ ...i, rank: n + 1 }));

      const g: Group = {
        id: `${tanggal}-${Date.now().toString(36)}`,
        tanggal,
        nama: nama.trim() || `Batch ${ideas.length} ide`,
        createdAt: Date.now(),
        sourceText: teks,
        ideas,
        meta: { model, source, tokensIn, tokensOut, calls, durasiMs: Date.now() - mulai },
      };

      await simpanGrup(g);
      if (catatan.length) setPeringatan(catatan[0]);
      router.push(`/g/${g.id}`);
    } catch (e) {
      setGalat((e as Error).message);
    } finally {
      setJalan(false);
    }
  }

  async function imporBackup(file: File) {
    try {
      const masuk = await bacaBackup(file);
      for (const g of masuk) await simpanGrup(g);
      setGrup(await semuaGrup());
      setInfoBackup(`${masuk.length} grup berhasil dimuat dari backup.`);
    } catch (e) {
      setInfoBackup(`Gagal memuat backup: ${(e as Error).message}`);
    }
    setTimeout(() => setInfoBackup(""), 4000);
  }

  async function hapus(id: string) {
    if (!confirm("Hapus grup ini beserta semua halamannya?")) return;
    await hapusGrup(id);
    setGrup(await semuaGrup());
  }

  const perTanggal = grup.reduce<Record<string, Group[]>>((acc, g) => {
    (acc[g.tanggal] ??= []).push(g);
    return acc;
  }, {});

  return (
    <>
      <Bilah />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="kartu p-5">
          <div className="mb-4 inline-flex rounded-lg border border-line bg-[#0f1219] p-1">
            {([["json", "JSON (tanpa API)"], ["teks", "Teks mentah"]] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={jalan}
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
                Tempel JSON berisi 12 ide lengkap. Semua field dipetakan langsung, jadi{" "}
                <strong className="text-slate-200">nol panggilan API dan nol kuota Gemini terpakai</strong>.
              </p>
              <button onClick={() => setLihatFormat((v) => !v)} className="tombol mt-3 text-xs">
                {lihatFormat ? "Sembunyikan format" : "Lihat format JSON"}
              </button>
              {lihatFormat && (
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-line bg-[#0f1219] p-3 text-[11px] leading-relaxed text-slate-300">
{`{
  "grup": "Batch Konten AI",
  "tanggal": "${tanggal}",
  "ide": [
    {
      "judul": "", "headline": "", "tool": "", "linkResmi": "", "harga": "",
      "slot": "Minggu 1 - GILA, TERNYATA BISA",
      "contentGap": "", "targetAudience": "", "masalah": "",
      "caraKerja": "", "wowMoment": "",
      "hook": "", "gerakanHook": "",
      "script": [
        { "waktu": "0-3s", "naskah": "", "gerakan": "" },
        { "waktu": "3-7s", "naskah": "", "gerakan": "" },
        { "waktu": "7-14s", "naskah": "", "gerakan": "" },
        { "waktu": "14-17s", "naskah": "", "gerakan": "" },
        { "waktu": "17-20s", "naskah": "", "gerakan": "" }
      ],
      "recording": [
        { "waktu": "0-3s", "visual": "", "tindakan": "" }
      ],
      "cta": "", "caption": "", "onScreenText": "A -> B",
      "scores": { "novelty": 0, "wow": 0, "relatability": 0,
                  "ease": 0, "free": 0, "curiosity": 0, "viral": 0 },
      "totalScore": 0, "catatanProduksi": ""
    }
  ]
}`}
                </pre>
              )}
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Prompt siap pakai untuk menghasilkan JSON ini ada di{" "}
                <code className="rounded bg-white/5 px-1">contoh/prompt-generator.md</code>. Jalankan di chat AI biasa
                (Gemini web, ChatGPT, Claude) supaya tidak memakai kuota API.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white">Paste teks mentah</h1>
              <p className="mt-1 text-sm text-muted">
                Catatan berantakan dirapikan Gemini. Butuh 1 panggilan API per ide, jadi 12 ide = 12 panggilan.
                Kalau ingin hemat kuota, pakai tab JSON.
              </p>
            </>
          )}

          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            placeholder={
              mode === "json"
                ? '{\n  "grup": "Batch Konten AI",\n  "ide": [ { "judul": "...", "tool": "...", "hook": "..." } ]\n}'
                : "IDE #1 - Foto Struk jadi Excel\nTool: Gemini\nHook: Jangan ketik struk ini ke Excel...\n\nIDE #2 - Hapus objek foto\nTool: Adobe Express\n..."
            }
            className="mt-4 h-72 w-full resize-y rounded-lg border border-line bg-[#0f1219] p-4 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 focus:border-accent"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded-md px-2 py-1 ${
                json ? "bg-emerald-500/15 text-emerald-300" : blok.length ? "bg-accent/15 text-accent" : "bg-white/5 text-muted"
              }`}
            >
              {json
                ? `JSON terbaca - ${json.ideas.length} ide, tanpa API`
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

          <button onClick={generate} disabled={jalan || (!json && !blok.length)} className="tombol-utama mt-5">
            {jalan
              ? "Memproses..."
              : json
                ? `Generate ${json.ideas.length} halaman (tanpa API)`
                : `Generate ${blok.length || ""} halaman`}
          </button>

          {progres && jalan && (
            <div className="mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.round((progres.selesai / Math.max(1, progres.total)) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">{progres.pesan}</p>
            </div>
          )}

          {galat && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{galat}</p>}
          {peringatan && (
            <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">{peringatan}</p>
          )}
        </section>

        <section className="kartu p-5">
          <h2 className="text-lg font-semibold text-white">Folder tersimpan</h2>
          <p className="mt-1 text-sm text-muted">Tersimpan di browser ini (IndexedDB). Tanpa database eksternal.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => unduhBackup(grup)} disabled={!grup.length} className="tombol text-xs">
              Backup semua
            </button>
            <label className="tombol cursor-pointer text-xs">
              Muat backup
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) imporBackup(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {infoBackup && <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-2 text-xs text-accent">{infoBackup}</p>}

          {!grup.length && <p className="mt-6 text-sm text-slate-500">Belum ada. Generate dulu di sebelah kiri.</p>}

          <div className="mt-4 space-y-5">
            {Object.entries(perTanggal).map(([tgl, list]) => (
              <div key={tgl}>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted">{tgl}</p>
                <div className="space-y-2">
                  {list.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 rounded-lg border border-line bg-[#0f1219] p-3">
                      <Link href={`/g/${g.id}`} className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-200">{g.nama}</span>
                        <span className="block text-xs text-muted">
                          {g.ideas.length} ide · {g.meta.source === "heuristik" ? "parser lokal" : g.meta.model}
                        </span>
                      </Link>
                      <button onClick={() => hapus(g.id)} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:text-red-400">
                        hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
