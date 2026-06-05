"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MoodIcon } from "@/components/mood-icon";
import { DEFAULT_MOODS } from "@/lib/default-moods";

interface ReactedArticle {
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
  moodTypeId: string;
}

const TONE_MAP: Record<string, { hue: string; bgHue: string }> = {
  peach:    { hue: "var(--peach)",    bgHue: "rgba(252,164,91,.14)" },
  lavender: { hue: "var(--purple)",   bgHue: "rgba(166,115,241,.14)" },
  mint:     { hue: "#2EA67D",         bgHue: "rgba(133,236,203,.22)" },
  yellow:   { hue: "var(--yellow)",   bgHue: "rgba(253,203,86,.22)" },
  blue:     { hue: "#5C9DBE",         bgHue: "rgba(154,205,226,.28)" },
  purple:   { hue: "var(--purple-strong)", bgHue: "rgba(151,71,255,.14)" },
};

const MOOD_MAP = new Map<string, (typeof DEFAULT_MOODS)[number]>(
  DEFAULT_MOODS.map((m) => [m.id, m]),
);

export function ArticleReactionsShell() {
  const locale = useLocale();
  const [articles, setArticles] = useState<ReactedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const l = (th: string | null, en: string | null) => (locale === "th" ? th : en) || th || en || "";

  useEffect(() => {
    fetch("/api/articles/reactions")
      .then((r) => r.json() as Promise<{ articles: ReactedArticle[] }>)
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

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
        {locale === "th" ? "อารมณ์หลังอ่านบทความ" : "Your article reactions"}
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-3)", margin: "0 0 24px" }}>
        {locale === "th" ? "บทความที่คุณเคยอ่าน และความรู้สึกที่บันทึกไว้" : "Articles you've read and how you felt about them"}
      </p>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="pulse" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)" }} />
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>☺</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            {locale === "th" ? "ยังไม่มีบทความที่บันทึกความรู้สึกไว้" : "No reactions yet"}
          </p>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 4 }}>
            {locale === "th" ? "หลังอ่านบทความจบ ลองเลือกอารมณ์ว่ารู้สึกยังไง" : "After reading an article, pick how it made you feel"}
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
            const mood = MOOD_MAP.get(article.moodTypeId);
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
                        ⏱ {article.readingTimeMinutes} {locale === "th" ? "นาที" : "min"}
                      </div>
                      {mood && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 6px", borderRadius: 100, background: tone.bgHue, fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>
                          <MoodIcon moodId={mood.id} size={20} />
                          {locale === "th" ? mood.labelTh : mood.label}
                        </span>
                      )}
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
