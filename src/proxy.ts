import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = verifyToken(token);
  if (!user) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
