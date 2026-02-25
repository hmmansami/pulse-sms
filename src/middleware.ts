import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authPages = new Set(["/login", "/register"]);

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname.startsWith("/api/health")) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico") return false;
  if (pathname.includes(".")) return false;
  return !authPages.has(pathname);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Try multiple cookie names for next-auth v5 compatibility
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

  // Forward workspace ID from session if available
  const requestHeaders = new Headers(req.headers);

  // Try to get workspace from JWT if possible
  try {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
    if (secret) {
      const token = await getToken({
        req,
        secret,
        cookieName: "__Secure-authjs.session-token",
      } as Parameters<typeof getToken>[0]);
      if (token?.workspaceId && typeof token.workspaceId === "string") {
        requestHeaders.set("x-workspace-id", token.workspaceId);
      }
    }
  } catch {
    // Token decryption may fail with v5 JWE tokens - that's ok
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
