import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

// Inject Cloudflare bindings (D1, R2) into `next dev` so getRequestContext() works.
// No-op in production (Cloudflare Pages provides bindings natively).
if (process.env.NODE_ENV === "development") {
  void import("@cloudflare/next-on-pages/next-dev").then((m) =>
    m.setupDevPlatform(),
  );
}

export default withNextIntl(nextConfig);
