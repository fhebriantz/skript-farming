/**
 * Sesi login sederhana berbasis cookie bertanda tangan HMAC.
 * Dipakai di middleware (edge) dan route handler (node), jadi hanya memakai Web Crypto.
 */

export const NAMA_COOKIE = "sf_sesi";
export const UMUR_SESI = 60 * 60 * 24 * 30; // 30 hari, supaya sekali masuk tidak ditanya lagi

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function dariB64url(s: string): string {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(p + "=".repeat((4 - (p.length % 4)) % 4));
}

function rahasia(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  // Cadangan supaya aplikasi tidak mati kalau AUTH_SECRET lupa diisi.
  return `${process.env.ADMIN_USER ?? ""}:${process.env.ADMIN_PASSWORD ?? ""}:sf-fallback`;
}

async function tandaTangan(pesan: string): Promise<string> {
  const kunci = await crypto.subtle.importKey(
    "raw",
    enc.encode(rahasia()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", kunci, enc.encode(pesan)));
}

/** Perbandingan waktu tetap supaya tidak bocor lewat selisih waktu eksekusi. */
export function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i++) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

export async function buatToken(user: string): Promise<string> {
  const isi = b64url(enc.encode(JSON.stringify({ u: user, exp: Date.now() + UMUR_SESI * 1000 })));
  return `${isi}.${await tandaTangan(isi)}`;
}

export async function tokenSah(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [isi, tanda] = token.split(".");
  if (!isi || !tanda) return false;
  if (!samaAman(tanda, await tandaTangan(isi))) return false;
  try {
    const { exp } = JSON.parse(dariB64url(isi));
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}
