import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authPages = new Set(["/login", "/register"]);

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname.startsWith("/api/health")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico") return false;
  if (pathname.includes(".")) return false;
  return !authPages.has(pathname);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req });
  const isAuthed = Boolean(token);

  if (!isAuthed && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && authPages.has(pathname)) {
    return NextResponse.redirect(new URL("/analytics", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  if (token?.workspaceId && typeof token.workspaceId === "string") {
    requestHeaders.set("x-workspace-id", token.workspaceId);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
