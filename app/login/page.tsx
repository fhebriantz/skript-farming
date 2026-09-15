"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Form() {
  const router = useRouter();
  const tujuan = useSearchParams().get("next") || "/";
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [jalan, setJalan] = useState(false);
  const [galat, setGalat] = useState("");

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setJalan(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Gagal masuk.");
      router.replace(tujuan);
      router.refresh();
    } catch (err) {
      setGalat((err as Error).message);
      setJalan(false);
    }
  }

  return (
    <form onSubmit={masuk} className="kartu w-full max-w-sm p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-sm font-bold text-white">SF</span>
        <div>
          <h1 className="text-base font-semibold leading-tight text-white">Script Farming</h1>
          <p className="text-xs leading-tight text-muted">Masuk dulu untuk melanjutkan</p>
        </div>
      </div>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-muted">Username</span>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
          autoFocus
          className="w-full rounded-lg border border-line bg-[#0f1219] px-3 py-2 text-slate-200 outline-none focus:border-accent"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-muted">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-lg border border-line bg-[#0f1219] px-3 py-2 text-slate-200 outline-none focus:border-accent"
        />
      </label>

      {galat && <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{galat}</p>}

      <button type="submit" disabled={jalan || !user || !password} className="tombol-utama w-full justify-center">
        {jalan ? "Memeriksa..." : "Masuk"}
      </button>

      <p className="mt-4 text-center text-xs text-muted">Sekali masuk, sesi bertahan 30 hari di perangkat ini.</p>
    </form>
  );
}

export default function HalamanLogin() {
  return (
    <div className="grid min-h-[80vh] place-items-center">
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Form />
      </Suspense>
    </div>
  );
}
