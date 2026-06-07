"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MoodIcon } from "@/components/mood-icon";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { PAClip, PAMark, PASticker, ArticleArt, toneHue, toneBg } from "@/components/paper";

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

const MOOD_MAP = new Map<string, (typeof DEFAULT_MOODS)[number]>(
  DEFAULT_MOODS.map((m) => [m.id, m]),
);

/** Slight alternating tilt so the list reads as a hand-stacked pile of clippings. */
const TILT = [-0.6, 0.5, -0.4, 0.7, -0.5];

export function ArticleReactionsShell() {
  const locale = useLocale();
  const th = locale === "th";
  const [articles, setArticles] = useState<ReactedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const l = (a: string | null, b: string | null) => (th ? a : b) || a || b || "";

  useEffect(() => {
    fetch("/api/articles/reactions")
      .then((r) => r.json() as Promise<{ articles: ReactedArticle[] }>)
      .then((data) => { setArticles(data.articles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="pa-wrap center-720 fade-in" style={{ paddingBottom: 60 }}>
      {/* back */}
      <Link
        href={"/profile" as "/"}
        className="pa-icon-btn"
        aria-label={th ? "กลับไปโปรไฟล์" : "Back to profile"}
        style={{ textDecoration: "none", marginBottom: 22 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {/* header — loose on the desk, theme ink (dark-safe) */}
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontSize: 14, fontWeight: 800, letterSpacing: ".06em",
          textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12,
        }}
      >
        <span aria-hidden style={{ fontSize: 16 }}>💭</span>
        {th ? "ความรู้สึกของคุณ" : "Your reactions"}
      </div>

      <h1 style={{ fontSize: "clamp(26px, 5vw, 32px)", fontWeight: 800, margin: 0, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--ink)" }}>
        {th ? (
          <>ความรู้สึกหลัง <PAMark color="var(--lavender)">อ่านบทความ</PAMark></>
        ) : (
          <>Your article <PAMark color="var(--lavender)">reactions</PAMark></>
        )}
      </h1>

      <p style={{ fontSize: 15, color: "var(--ink-2)", margin: "10px 0 0", lineHeight: 1.5 }}>
        {th ? "บทความที่คุณอ่าน และอารมณ์ที่เลือกไว้" : "Articles you've read and how they made you feel."}
        {!loading && articles.length > 0 && (
          <span style={{ color: "var(--ink-3)", fontWeight: 700 }}>
            {" · "}{articles.length} {th ? "บทความ" : articles.length === 1 ? "article" : "articles"}
          </span>
        )}
      </p>

      <div style={{ height: 28 }} />

      {/* loading — paper skeleton clippings */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="pa-sheet" style={{ padding: 16, display: "flex", gap: 16, transform: `rotate(${TILT[i]}deg)` }}>
              <div className="pulse" style={{ width: 96, height: 96, borderRadius: 12, background: "var(--w-tint)", flexShrink: 0 }} />
              <div style={{ flex: 1, paddingTop: 6, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pulse" style={{ width: 90, height: 16, borderRadius: 6, background: "var(--w-tint)" }} />
                <div className="pulse" style={{ width: "80%", height: 18, borderRadius: 6, background: "var(--w-tint)" }} />
                <div className="pulse" style={{ width: "55%", height: 14, borderRadius: 6, background: "var(--w-tint)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* empty */}
      {!loading && articles.length === 0 && (
        <div className="pa-sheet" style={{ padding: "52px 28px 44px", textAlign: "center", position: "relative", overflow: "visible" }}>
          <span className="pa-washi mint" aria-hidden />
          <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 18px" }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(133,236,203,.3), transparent 68%)" }} />
            <div className="pa-float" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <PASticker moodId="happy" color="var(--mint)" size={68} />
            </div>
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--w-ink)", margin: 0 }}>
            {th ? "ยังไม่มีบทความที่บันทึกความรู้สึก" : "No reactions yet"}
          </p>
          <p style={{ fontSize: 15, color: "var(--w-ink-2)", margin: "8px auto 22px", lineHeight: 1.55, maxWidth: 320 }}>
            {th ? "อ่านบทความจบแล้ว เลือกอารมณ์ว่ารู้สึกยังไง — จะมาเก็บไว้ตรงนี้" : "After you finish an article, pick how it made you feel — it'll show up here."}
          </p>
          <Link
            href={"/articles" as "/"}
            className="pa-btn purple"
            style={{ textDecoration: "none", height: "auto", padding: "11px 22px", lineHeight: 1.3 }}
          >
            {th ? "ไปอ่านบทความ" : "Browse articles"}
          </Link>
        </div>
      )}

      {/* list — paperclipped clippings, each stamped with the felt mood */}
      {!loading && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {articles.map((article, i) => {
            const hue = toneHue(article.tone);
            const bg = toneBg(article.tone);
            const mood = MOOD_MAP.get(article.moodTypeId);
            const tilt = TILT[i % TILT.length];
            return (
              <Link key={article.slug} href={`/articles/${article.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
                <article
                  className="pa-sheet pa-card-lift"
                  style={{ padding: 16, paddingRight: 18, display: "flex", gap: 16, alignItems: "flex-start", transform: `rotate(${tilt}deg)`, overflow: "visible" }}
                >
                  <PAClip style={{ top: -16, left: 30, zIndex: 4 }} />

                  {/* cover — framed photo or tone artwork, stamped with the felt mood */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 96, height: 96, borderRadius: 12,
                        overflow: "hidden", background: bg,
                        border: "3px solid #fff", boxShadow: "0 8px 18px -10px rgba(60,40,20,.5)",
                      }}
                    >
                      {article.coverImageUrl ? (
                        <div style={{ width: "100%", height: "100%", background: `url(${article.coverImageUrl}) center/cover` }} />
                      ) : (
                        <ArticleArt tone={article.tone} />
                      )}
                    </div>
                    {mood && (
                      <PASticker
                        moodId={mood.id}
                        color={mood.color}
                        size={42}
                        style={{ position: "absolute", bottom: -10, right: -10, zIndex: 5 }}
                      />
                    )}
                  </div>

                  {/* body */}
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    {article.categoryLabelTh && (
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "4px 11px", borderRadius: 100, background: bg, color: hue,
                          fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em",
                        }}
                      >
                        {l(article.categoryLabelTh, article.categoryLabelEn)}
                      </span>
                    )}
                    <h2
                      style={{
                        fontSize: 17, fontWeight: 800, lineHeight: 1.3, color: "var(--w-ink)",
                        margin: "8px 0 5px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}
                    >
                      {l(article.titleTh, article.titleEn)}
                    </h2>
                    <p
                      style={{
                        fontSize: 14, color: "var(--w-ink-2)", lineHeight: 1.5, margin: 0,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}
                    >
                      {l(article.excerptTh, article.excerptEn)}
                    </p>

                    {/* footer — the felt mood named, reading time, read-more */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {mood && (
                          <span
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "4px 12px 4px 6px", borderRadius: 100,
                              background: `${mood.color}2E`, fontSize: 14, fontWeight: 800, color: "var(--w-ink)",
                            }}
                          >
                            <MoodIcon moodId={mood.id} size={20} />
                            {th ? mood.labelTh : mood.label}
                          </span>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink-3)" }}>
                          ⏱ {article.readingTimeMinutes} {th ? "นาที" : "min"}
                        </span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 800, color: "var(--purple-strong)" }}>
                        {th ? "อ่านต่อ" : "Read"}
                        <span aria-hidden>→</span>
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
