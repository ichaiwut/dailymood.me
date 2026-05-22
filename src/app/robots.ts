import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Meta / Facebook crawlers — allow everything so link previews work
      { userAgent: "facebookexternalhit", allow: "/" },
      { userAgent: "Facebot", allow: "/" },
      { userAgent: "meta-externalagent", allow: "/" },
      { userAgent: "meta-externalfetcher", allow: "/" },
      { userAgent: "*", disallow: ["/api/", "/admin/", "/login", "/profile", "/calendar", "/stats", "/auth/"] },
    ],
  };
}
