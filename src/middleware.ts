import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPages = new Set(["/login", "/register"]);

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico") return false;
  if (pathname.includes(".")) return false;
  return !authPages.has(pathname);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for session cookie directly (lightweight, no heavy imports)
  const sessionCookie =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  const isAuthed = Boolean(sessionCookie);

  if (!isAuthed && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && authPages.has(pathname)) {
    return NextResponse.redirect(new URL("/analytics", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
