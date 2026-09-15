import { NextResponse, type NextRequest } from "next/server";
import { NAMA_COOKIE, tokenSah } from "@/lib/auth";

/** Semua halaman dan API dikunci, kecuali halaman login itu sendiri dan aset statis. */
const BEBAS = ["/login", "/api/login", "/api/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (BEBAS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();

  if (await tokenSah(req.cookies.get(NAMA_COOKIE)?.value)) return NextResponse.next();

  // API menjawab 401 supaya fetch di klien bisa menanganinya, halaman biasa dialihkan ke login.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
