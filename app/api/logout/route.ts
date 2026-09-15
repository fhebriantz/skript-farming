import { NextResponse } from "next/server";
import { NAMA_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NAMA_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
