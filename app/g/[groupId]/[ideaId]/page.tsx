"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Bilah } from "@/components/Bilah";
import { Pratinjau } from "@/components/Pratinjau";
import { ambilGrup } from "@/lib/store";
import { isiIde, namaFile } from "@/lib/docHtml";
import { copyKaya, unduhIde } from "@/lib/export";
import type { Group, Idea } from "@/lib/types";

export default function HalamanIde({ params }: { params: Promise<{ groupId: string; ideaId: string }> }) {
  const { groupId, ideaId } = use(params);
  const [g, setG] = useState<Group | null>(null);
  const [muat, setMuat] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    ambilGrup(groupId)
      .then((x) => setG(x ?? null))
      .finally(() => setMuat(false));
  }, [groupId]);

  if (muat) return <p className="p-6 text-sm text-muted">Memuat...</p>;

  const ide: Idea | undefined = g?.ideas.find((i) => i.id === ideaId);
  if (!g || !ide)
    return (
      <>
        <Bilah />
        <p className="kartu p-6 text-sm text-muted">
          Halaman tidak ditemukan. <Link href="/" className="text-accent">Kembali</Link>
        </p>
      </>
    );

  const html = isiIde(ide, g.ideas.length);
  const posisi = g.ideas.findIndex((i) => i.id === ide.id);
  const sebelum = g.ideas[posisi - 1];
  const sesudah = g.ideas[posisi + 1];

  async function salin() {
    const ok = await copyKaya(html);
    setStatus(ok ? "Tersalin. Paste ke Google Docs, ukuran font ikut terbawa." : "Gagal menyalin.");
    setTimeout(() => setStatus(""), 2500);
  }

  return (
    <>
      <Bilah
        kanan={
          <>
            <Link href={`/g/${g.id}`} className="tombol">
              Kembali ke folder
            </Link>
            <button onClick={() => unduhIde(ide, g.ideas.length)} className="tombol">
              Unduh {namaFile(ide)}
            </button>
            <button onClick={salin} className="tombol-utama">
              Copy ke Docs
            </button>
          </>
        }
      />

      {status && <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">{status}</p>}

      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        {sebelum ? (
          <Link href={`/g/${g.id}/${sebelum.id}`} className="tombol">
            &larr; #{sebelum.rank} {sebelum.judul.slice(0, 28)}
          </Link>
        ) : (
          <span />
        )}
        {sesudah ? (
          <Link href={`/g/${g.id}/${sesudah.id}`} className="tombol">
            #{sesudah.rank} {sesudah.judul.slice(0, 28)} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </div>

      <Pratinjau html={html} />
    </>
  );
}
