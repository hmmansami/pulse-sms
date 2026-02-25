import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const authPages = new Set(["/login", "/register"]);

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname.startsWith("/api/health")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico") return false;
  if (pathname.includes(".")) return false;
  return !authPages.has(pathname);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = Boolean(req.auth);

  if (!isAuthed && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && authPages.has(pathname)) {
    return NextResponse.redirect(new URL("/analytics", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  if (req.auth?.user?.workspaceId) {
    requestHeaders.set("x-workspace-id", req.auth.user.workspaceId);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
