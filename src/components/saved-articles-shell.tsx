"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

interface SavedArticle {
  slug: string;
  titleTh: string;
  titleEn: string;
  excerptTh: string;
  excerptEn: string;
  coverImageUrl: string | null;
  categoryLabelTh: string | null;
  categoryLabelEn: string | null;
  readingTimeMinutes: number;
  tone: string;
}

const TONE_MAP: Record<string, { hue: string; bgHue: string }> = {
  peach:    { hue: "var(--peach)",    bgHue: "rgba(252,164,91,.14)" },
  lavender: { hue: "var(--purple)",   bgHue: "rgba(166,115,241,.14)" },
  mint:     { hue: "#2EA67D",         bgHue: "rgba(133,236,203,.22)" },
  yellow:   { hue: "var(--yellow)",   bgHue: "rgba(253,203,86,.22)" },
  blue:     { hue: "#5C9DBE",         bgHue: "rgba(154,205,226,.28)" },
  purple:   { hue: "var(--purple-strong)", bgHue: "rgba(151,71,255,.14)" },
};

export function SavedArticlesShell() {
  const locale = useLocale();
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const l = (th: string | null, en: string | null) => (locale === "th" ? th : en) || th || en || "";

  useEffect(() => {
    fetch("/api/articles/bookmarks")
      .then((r) => r.json() as Promise<{ articles: SavedArticle[] }>)
      .then((data) => { setArticles(data.articles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="center-720 fade-in" style={{ paddingBottom: 60 }}>
      <Link
        href={"/profile" as "/"}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--ink-3)", textDecoration: "none", marginBottom: 20 }}
      >
        ← {locale === "th" ? "โปรไฟล์" : "Profile"}
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 24px", letterSpacing: "-0.02em" }}>
        {locale === "th" ? "บทความที่บันทึกไว้" : "Saved Articles"}
      </h1>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="pulse" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)" }} />
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>♡</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            {locale === "th" ? "ยังไม่มีบทความที่บันทึกไว้" : "No saved articles yet"}
          </p>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 4 }}>
            {locale === "th" ? "กดปุ่ม ♡ บนบทความที่ชอบ เพื่อบันทึกไว้อ่านทีหลัง" : "Tap ♡ on an article to save it for later"}
          </p>
          <Link
            href={"/articles" as "/"}
            className="w-btn w-btn-primary"
            style={{ textDecoration: "none", marginTop: 16, display: "inline-flex" }}
          >
            {locale === "th" ? "ไปอ่านบทความ" : "Browse articles"}
          </Link>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {articles.map((article) => {
            const tone = TONE_MAP[article.tone] ?? TONE_MAP.peach;
            return (
              <Link key={article.slug} href={`/articles/${article.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card" style={{ borderRadius: 18, padding: 18, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {article.coverImageUrl ? (
                    <div style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0, background: `url(${article.coverImageUrl}) center/cover` }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0, background: tone.bgHue, display: "grid", placeItems: "center", fontSize: 28 }}>📖</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {article.categoryLabelTh && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: tone.hue, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        {l(article.categoryLabelTh, article.categoryLabelEn)}
                      </span>
                    )}
                    <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, margin: "2px 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {l(article.titleTh, article.titleEn)}
                    </h3>
                    <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {l(article.excerptTh, article.excerptEn)}
                    </p>
                    <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 6 }}>
                      ⏱ {article.readingTimeMinutes} {locale === "th" ? "นาที" : "min"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
