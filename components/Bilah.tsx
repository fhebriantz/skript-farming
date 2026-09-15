"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function Bilah({ kanan }: { kanan?: React.ReactNode }) {
  const router = useRouter();

  async function keluar() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link href="/" className="group flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">SF</span>
        <span>
          <span className="block text-sm font-semibold leading-tight text-white">Script Farming</span>
          <span className="block text-xs leading-tight text-muted">paste sekali, jadi banyak halaman</span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {kanan}
        <button onClick={keluar} className="tombol" title="Keluar dari sesi">
          Keluar
        </button>
      </div>
    </header>
  );
}
