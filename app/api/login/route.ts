import { NextResponse } from "next/server";
import { NAMA_COOKIE, UMUR_SESI, buatToken, samaAman } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { user?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const userBenar = process.env.ADMIN_USER ?? "";
  const passBenar = process.env.ADMIN_PASSWORD ?? "";
  if (!userBenar || !passBenar) {
    return NextResponse.json(
      { error: "ADMIN_USER / ADMIN_PASSWORD belum diatur di environment." },
      { status: 500 }
    );
  }

  const user = String(body.user ?? "");
  const pass = String(body.password ?? "");
  // Dua-duanya selalu dievaluasi supaya lama respons tidak membocorkan mana yang salah.
  const cocok = samaAman(user, userBenar) && samaAman(pass, passBenar);
  if (!cocok) {
    await new Promise((r) => setTimeout(r, 400)); // rem tipis untuk percobaan beruntun
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(NAMA_COOKIE, await buatToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI,
  });
  return res;
}
