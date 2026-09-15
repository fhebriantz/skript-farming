"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Bilah } from "@/components/Bilah";
import { Pratinjau } from "@/components/Pratinjau";
import { ambilGrup } from "@/lib/store";
import { bungkus, isiIndex } from "@/lib/docHtml";
import { copyKaya, unduhFile, unduhZipGrup } from "@/lib/export";
import type { Group } from "@/lib/types";

export default function HalamanGrup({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const [g, setG] = useState<Group | null>(null);
  const [muat, setMuat] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    ambilGrup(groupId)
      .then((x) => setG(x ?? null))
      .finally(() => setMuat(false));
  }, [groupId]);

  if (muat) return <p className="p-6 text-sm text-muted">Memuat...</p>;
  if (!g)
    return (
      <>
        <Bilah />
        <p className="kartu p-6 text-sm text-muted">
          Grup tidak ditemukan di browser ini. <Link href="/" className="text-accent">Kembali</Link>
        </p>
      </>
    );

  const indexHtml = isiIndex(g);

  async function salin() {
    const ok = await copyKaya(indexHtml);
    setStatus(ok ? "Index tersalin. Paste ke Google Docs." : "Gagal menyalin.");
    setTimeout(() => setStatus(""), 2500);
  }

  return (
    <>
      <Bilah
        kanan={
          <>
            <button onClick={salin} className="tombol">Copy index</button>
            <button onClick={() => unduhFile("#0-INDEX.html", bungkus(g.nama, indexHtml))} className="tombol">
              Unduh index
            </button>
            <button onClick={() => unduhZipGrup(g)} className="tombol-utama">
              Unduh ZIP ({g.ideas.length + 2} file)
            </button>
          </>
        }
      />

      <div className="kartu mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">folder {g.tanggal}</p>
          <h1 className="text-xl font-semibold text-white">{g.nama}</h1>
        </div>
        <dl className="flex flex-wrap gap-6 text-sm">
          <div>
            <dt className="text-muted">Ide</dt>
            <dd className="font-semibold text-white">{g.ideas.length}</dd>
          </div>
          <div>
            <dt className="text-muted">Sumber</dt>
            <dd className="font-semibold text-white">{g.meta.source === "heuristik" ? "parser lokal" : g.meta.model}</dd>
          </div>
          <div>
            <dt className="text-muted">Token</dt>
            <dd className="font-semibold text-white">
              {(g.meta.tokensIn + g.meta.tokensOut).toLocaleString("id-ID")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Durasi</dt>
            <dd className="font-semibold text-white">{(g.meta.durasiMs / 1000).toFixed(1)}s</dd>
          </div>
        </dl>
      </div>

      {status && <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">{status}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Halaman ide</h2>
          <div className="space-y-2">
            {g.ideas.map((i) => (
              <Link
                key={i.id}
                href={`/g/${g.id}/${i.id}`}
                className="flex items-center gap-4 rounded-lg border border-line bg-panel p-4 transition hover:border-accent"
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
              </Link>
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
