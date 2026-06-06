"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PAClip, PAMark, ArticleArt, toneHue, toneBg } from "@/components/paper";

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

/** Slight alternating tilt so the list reads as a hand-stacked pile of clippings. */
const TILT = [-0.6, 0.5, -0.4, 0.7, -0.5];

export function SavedArticlesShell() {
  const locale = useLocale();
  const th = locale === "th";
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const l = (a: string | null, b: string | null) => (th ? a : b) || a || b || "";

  useEffect(() => {
    fetch("/api/articles/bookmarks")
      .then((r) => r.json() as Promise<{ articles: SavedArticle[] }>)
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
        <span aria-hidden style={{ fontSize: 16 }}>📎</span>
        {th ? "คลังของคุณ" : "Your library"}
      </div>

      <h1 style={{ fontSize: "clamp(26px, 5vw, 32px)", fontWeight: 800, margin: 0, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--ink)" }}>
        {th ? (
          <>บทความที่ <PAMark color="var(--peach)">เก็บไว้อ่าน</PAMark></>
        ) : (
          <><PAMark color="var(--peach)">Saved</PAMark> articles</>
        )}
      </h1>

      <p style={{ fontSize: 15, color: "var(--ink-2)", margin: "10px 0 0", lineHeight: 1.5 }}>
        {th ? "บทความที่คุณกดบันทึกไว้อ่านทีหลัง" : "Everything you've bookmarked to read later."}
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
          <span className="pa-washi lav" aria-hidden />
          <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 18px" }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(166,115,241,.22), transparent 68%)" }} />
            <div className="pa-float" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" fill="var(--lavender)" stroke="var(--purple-strong)" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--w-ink)", margin: 0 }}>
            {th ? "ยังไม่มีบทความที่เก็บไว้" : "Nothing saved yet"}
          </p>
          <p style={{ fontSize: 15, color: "var(--w-ink-2)", margin: "8px auto 22px", lineHeight: 1.55, maxWidth: 320 }}>
            {th ? "กดรูปหัวใจบนบทความที่ชอบ เก็บไว้กลับมาอ่านได้ทุกเมื่อ" : "Tap the heart on an article you like — it'll wait for you here."}
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

      {/* list — paperclipped clippings */}
      {!loading && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {articles.map((article, i) => {
            const hue = toneHue(article.tone);
            const bg = toneBg(article.tone);
            const tilt = TILT[i % TILT.length];
            return (
              <Link key={article.slug} href={`/articles/${article.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
                <article
                  className="pa-sheet pa-card-lift"
                  style={{ padding: 16, paddingRight: 18, display: "flex", gap: 16, alignItems: "flex-start", transform: `rotate(${tilt}deg)`, overflow: "visible" }}
                >
                  <PAClip style={{ top: -16, left: 30, zIndex: 4 }} />

                  {/* cover — framed photo or tone artwork */}
                  <div
                    style={{
                      width: 96, height: 96, borderRadius: 12, flexShrink: 0,
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

                    {/* footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 11px", borderRadius: 100, background: "var(--w-tint)",
                          fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)",
                        }}
                      >
                        <span aria-hidden>⏱</span>
                        {article.readingTimeMinutes} {th ? "นาที" : "min"}
                      </span>
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
