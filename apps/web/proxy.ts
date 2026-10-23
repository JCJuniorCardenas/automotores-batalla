import { NextResponse, type NextRequest } from "next/server";

// Hosts desde los que se permite entrar al panel cuando BLOCK_ADMIN_ON_PUBLIC_HOST=1
// (se usa al compartir la demo por un túnel: el panel solo se ve desde esta computadora).
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

function adminBlocked(request: NextRequest) {
  if (process.env.BLOCK_ADMIN_ON_PUBLIC_HOST !== "1") return false;
  return !LOCAL_HOST.test(request.headers.get("host") ?? "");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Con el bloqueo activo, el panel y los endpoints de administración no existen para hosts públicos.
  if (adminBlocked(request)) return new NextResponse("Not found", { status: 404 });

  // La redirección al login es solo para las pantallas del panel, no para los endpoints /api/*.
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) return NextResponse.next();
  const hasSession = request.cookies.has("ab_access") || request.cookies.has("ab_refresh");
  if (!hasSession) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

// Panel y API de administración/sesión. (La API pública, /api/cars, etc., no pasa por acá.)
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"] };
