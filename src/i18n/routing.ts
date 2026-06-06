import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["th", "en"],
  defaultLocale: "th",
  localePrefix: "never",
  // Detection ON so the NEXT_LOCALE cookie is honored (the language toggle sets
  // it) and not clobbered back to the default on every response. The middleware
  // injects a default `th` cookie when none exists, so accept-language is never
  // consulted — the app stays Thai-first unless the user explicitly switches.
  localeDetection: true,
});
