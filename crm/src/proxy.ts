import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = isValidSessionToken(session);

  if (!authenticated && !isPublic) {
    const loginUrl = new URL("/login", request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
