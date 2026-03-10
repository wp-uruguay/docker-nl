import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.NL360_JWT_COOKIE_NAME || "nl360_jwt";

// Rutas que NO deben requerir auth
function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/agent-message" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/public/") ||
    pathname.startsWith("/assets/")
  );
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/agent-message")) {
    return NextResponse.next();
  }

  // Dejar pasar rutas públicas
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Si no hay token → redirect a /login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // opcional: volver al lugar original
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Si hay token, dejamos pasar (validación real la hace /api/auth/me cuando se necesite)
  return NextResponse.next();
}

// Match de todo excepto estáticos comunes (extra safety)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
