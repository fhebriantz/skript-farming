"use client";

import Link from "next/link";

export function Bilah({ kanan }: { kanan?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-bold text-white">
          SF
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-tight text-white">Script Farming</span>
          <span className="block truncate text-xs leading-tight text-muted">paste sekali, jadi banyak halaman</span>
        </span>
      </Link>
      {/* Di layar kecil tombol dibagi rata selebar baris supaya tidak berjejal di pojok. */}
      {kanan && (
        <div className="flex w-full flex-wrap items-center gap-2 [&>*]:flex-1 sm:w-auto sm:[&>*]:flex-none">
          {kanan}
        </div>
      )}
    </header>
  );
}
