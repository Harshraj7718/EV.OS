import { NextResponse, type NextRequest } from "next/server";

/**
 * Multi-portal Vercel deployments. This same codebase can be deployed as 5
 * separate Vercel projects — one per role (super-admin, admin, investor,
 * rider, business) — each getting its own URL, by setting NEXT_PUBLIC_PORTAL
 * per-project. See docs/vercel-deployment.md. When unset (local dev, Docker
 * Compose), this is a no-op and every route is served as one app, exactly
 * as before this existed.
 *
 * This is NOT an auth boundary — tokens live in localStorage (see
 * components/auth/ProtectedRoute.tsx), invisible here, so there's no way
 * to check who's logged in. It only restricts *which route
 * trees exist* on a given portal deployment; role/permission enforcement
 * is unchanged — still ProtectedRoute (UX) + the backend API (the real
 * boundary), on every portal identically.
 */
const PORTAL_PREFIXES: Record<string, string> = {
  "super-admin": "/super-admin",
  admin: "/admin",
  investor: "/investor",
  rider: "/rider",
  business: "/business",
};

const ALWAYS_ALLOWED = new Set(["/", "/login", "/register", "/dashboard"]);

export function proxy(request: NextRequest) {
  const portal = process.env.NEXT_PUBLIC_PORTAL;
  const allowedPrefix = portal ? PORTAL_PREFIXES[portal] : undefined;
  if (!allowedPrefix) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (ALWAYS_ALLOWED.has(pathname) || pathname.startsWith(allowedPrefix)) {
    return NextResponse.next();
  }

  const isAnotherPortalRoute = Object.values(PORTAL_PREFIXES).some(
    (prefix) => prefix !== allowedPrefix && pathname.startsWith(prefix),
  );
  if (!isAnotherPortalRoute) {
    return NextResponse.next();
  }

  // No route matches this made-up path, so Next's global not-found.tsx
  // renders — same "Page not found" a visitor gets for any nonexistent
  // URL, with a real 404 status, not a redirect that would leak that the
  // route exists on some other deployment.
  return NextResponse.rewrite(new URL("/__portal_not_found__", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
