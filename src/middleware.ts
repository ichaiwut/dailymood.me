import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // Ensure a locale cookie is always present before next-intl resolves the
  // locale. With localeDetection on, an existing NEXT_LOCALE cookie (set by the
  // language toggle) is honored; when none exists we inject the default (th) so
  // next-intl never falls back to the browser's accept-language header — the app
  // is Thai-first and the language is only changed via the explicit toggle.
  if (!req.cookies.has("NEXT_LOCALE")) {
    req.cookies.set("NEXT_LOCALE", routing.defaultLocale);
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
