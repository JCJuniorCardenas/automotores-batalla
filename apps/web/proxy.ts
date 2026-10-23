import { NextResponse, type NextRequest } from "next/server";

// Redirección optimista: solo mira si hay cookies de sesión. La autorización real la hace la API.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  const hasSession = request.cookies.has("ab_access") || request.cookies.has("ab_refresh");
  if (!hasSession) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
