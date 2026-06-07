import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Browser origins allowed to call /api/* cross-origin. Native iOS/Android apps do
// NOT enforce CORS, so this only matters for web clients (e.g. Expo running on web
// during dev). We reflect a specific allowlisted origin rather than "*", and never
// send Allow-Credentials — the mobile app authenticates with a Bearer token, not a
// cookie, so cross-origin cookie sharing is intentionally not enabled.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:8081", // Expo web (Metro)
  "http://localhost:19006", // Expo web (classic)
  "http://localhost:3000", // local Next dev
]);

// Routes that ship their own (stricter) CORS handling — leave them untouched so we
// don't emit duplicate Access-Control-Allow-Origin headers.
function selfHandlesCors(pathname: string): boolean {
  return pathname.startsWith("/api/guest/") || pathname === "/api/articles/latest";
}

function corsHeadersFor(origin: string | null): Record<string, string> | null {
  if (!origin) return null;
  const allowed = ALLOWED_ORIGINS.has(origin) || origin === process.env.MOBILE_WEB_ORIGIN;
  if (!allowed) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- CORS for the API (browser clients only; native apps skip CORS) ---
  if (pathname.startsWith("/api/")) {
    if (selfHandlesCors(pathname)) return NextResponse.next();

    const cors = corsHeadersFor(req.headers.get("origin"));
    if (req.method === "OPTIONS") {
      // Preflight: answer here without touching the route handler.
      return new NextResponse(null, { status: 204, headers: cors ?? {} });
    }
    const res = NextResponse.next();
    if (cors) for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  }

  // --- i18n for everything else (unchanged) ---
  // Ensure a locale cookie is always present before next-intl resolves the locale.
  // With localeDetection on, an existing NEXT_LOCALE cookie (set by the language
  // toggle) is honored; when none exists we inject the default (th) so next-intl
  // never falls back to the browser's accept-language header — the app is Thai-first
  // and the language is only changed via the explicit toggle.
  if (!req.cookies.has("NEXT_LOCALE")) {
    req.cookies.set("NEXT_LOCALE", routing.defaultLocale);
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api|admin|_next|.*\\..*).*)",
  ],
};
