"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArticleBody } from "./article-body";

interface Article {
  id: string;
  slug: string;
  titleTh: string;
  titleEn: string;
  excerptTh: string;
  excerptEn: string;
  bodyTh: string;
  bodyEn: string;
  coverImageUrl: string | null;
  tone: string;
  tags: string[];
  viewCount: number;
  readingTimeMinutes: number;
  publishedAt: string | null;
  keyTakeawayTh: string | null;
  keyTakeawayEn: string | null;
  hasKeyTakeaway?: boolean;
}

interface Category {
  id: string;
  slug: string;
  labelTh: string;
  labelEn: string;
}

interface RelatedArticle {
  slug: string;
  titleTh: string;
  titleEn: string;
  categoryLabelTh: string | null;
  categoryLabelEn: string | null;
  readingTimeMinutes: number;
  tone: string;
}

const TONE_MAP: Record<string, { hue: string; bgHue: string }> = {
  peach:    { hue: "var(--peach)",         bgHue: "rgba(252,164,91,.14)" },
  lavender: { hue: "var(--purple)",        bgHue: "rgba(166,115,241,.14)" },
  mint:     { hue: "#2EA67D",              bgHue: "rgba(133,236,203,.22)" },
  yellow:   { hue: "var(--yellow)",        bgHue: "rgba(253,203,86,.22)" },
  blue:     { hue: "#5C9DBE",              bgHue: "rgba(154,205,226,.28)" },
  purple:   { hue: "var(--purple-strong)", bgHue: "rgba(151,71,255,.14)" },
};

const REACTION_MOODS = [
  { id: "amazing", emoji: "😄", color: "#FCA45B" },
  { id: "happy",   emoji: "🙂", color: "#85ECCB" },
  { id: "neutral", emoji: "😐", color: "#FDCB56" },
  { id: "sad",     emoji: "😔", color: "#9ACDE2" },
  { id: "tired",   emoji: "😴", color: "#A673F1" },
];

interface TocItem { id: string; text: string; n: number }

function parseHeadings(body: string): TocItem[] {
  const items: TocItem[] = [];
  let n = 0;
  for (const line of body.split("\n")) {
    const m = line.match(/^##\s+(.+)/);
    if (m) {
      n++;
      const text = m[1].replace(/[*_`#]/g, "").trim();
      items.push({ id: `section-${n}`, text, n });
    }
  }
  return items;
}

export function ArticleDetailShell({ slug, isGuest = false }: { slug: string; isGuest?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("articles");
  const tCommon = useTranslations("aiDisclaimer");

  const [article, setArticle] = useState<Article | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [progress, setProgress] = useState(0);
  const [reactionMood, setReactionMood] = useState<string | null>(null);

  const articleRef = useRef<HTMLElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const l = useCallback((th: string | null, en: string | null) =>
    (locale === "th" ? th : en) || th || en || "",
  [locale]);

  useEffect(() => {
    fetch(`/api/articles/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json() as Promise<{
          article: Article;
          category: Category | null;
          bookmarked: boolean;
          saveCount: number;
          related: RelatedArticle[];
        }>;
      })
      .then((data) => {
        if (!data) return;
        setArticle(data.article);
        setCategory(data.category);
        setBookmarked(data.bookmarked);
        setSaveCount(data.saveCount);
        setRelated(data.related);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  // Scroll progress
  useEffect(() => {
    if (!articleRef.current) return;
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight;
      const scrolled = Math.max(0, -rect.top);
      setProgress(Math.min(1, Math.max(0, scrolled / (total - window.innerHeight))));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading]);

  // Scroll-based active section detection for ToC
  useEffect(() => {
    if (loading || !article) return;
    function updateActiveSection() {
      const headings = document.querySelectorAll("[id^='section-']");
      if (headings.length === 0) return;
      let current = 1;
      for (const h of headings) {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 120) {
          const n = parseInt(h.id.replace("section-", ""), 10);
          if (n) current = n;
        }
      }
      setActiveSection(current);
    }
    const timer = setTimeout(() => {
      updateActiveSection();
      window.addEventListener("scroll", updateActiveSection, { passive: true });
      cleanupRef.current = () => window.removeEventListener("scroll", updateActiveSection);
    }, 150);
    return () => { clearTimeout(timer); cleanupRef.current?.(); };
  }, [loading, article]);

  async function toggleBookmark() {
    if (isGuest) return;
    const method = bookmarked ? "DELETE" : "POST";
    setBookmarked(!bookmarked);
    setSaveCount((c) => c + (bookmarked ? -1 : 1));
    await fetch(`/api/articles/${slug}/bookmark`, { method });
  }

  async function shareArticle() {
    const url = window.location.href;
    const title = article ? l(article.titleTh, article.titleEn) : "";
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert(t("linkCopied"));
    }
  }

  async function reactMood(moodId: string) {
    if (isGuest) return;
    setReactionMood(moodId);
    await fetch(`/api/articles/${slug}/reaction`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ moodTypeId: moodId }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div className="pulse" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)" }} />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="center-720 fade-in" style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t("notFoundTitle")}</h2>
        <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 20 }}>{t("notFoundBody")}</p>
        <Link href={"/articles" as "/"} className="w-btn w-btn-primary" style={{ textDecoration: "none" }}>
          {t("backToArticles")}
        </Link>
      </div>
    );
  }

  const tone = TONE_MAP[article.tone] ?? TONE_MAP.peach;
  const title = l(article.titleTh, article.titleEn);
  const subtitle = l(article.excerptTh, article.excerptEn);
  const rawBody = l(article.bodyTh, article.bodyEn);

  const hrIdx = rawBody.lastIndexOf("\n---");
  const body = hrIdx >= 0 ? rawBody.slice(0, hrIdx).trim() : rawBody;
  const keyTakeaway = l(article.keyTakeawayTh, article.keyTakeawayEn);

  const toc = parseHeadings(body);
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div className="fade-in" style={{ padding: "8px 0 60px" }}>
      {/* Top action bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <Link href={"/articles" as "/"} style={{ color: "var(--ink-3)", textDecoration: "none", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← {t("backToArticles")}
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isGuest ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", fontSize: 14, color: "var(--ink-3)", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--hairline)" }}>
              ♡ {t("guestBookmarkHint")}
            </span>
          ) : (
            <button
              className="w-btn w-btn-ghost"
              style={{ height: 36, padding: "0 14px", fontSize: 14 }}
              onClick={toggleBookmark}
            >
              <span style={{ color: bookmarked ? "#e53e3e" : "var(--ink-2)" }}>{bookmarked ? "♥" : "♡"}</span>
              {" "}{t("save")} ({saveCount})
            </button>
          )}
          <button
            className="w-btn w-btn-ghost"
            style={{ height: 36, padding: "0 14px", fontSize: 14 }}
            onClick={shareArticle}
          >
            ↗ {t("share")}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="article-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 36, alignItems: "flex-start" }}>
        {/* Main article */}
        <article ref={articleRef}>
          {/* Header */}
          <header style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {category && (
                <span style={{ padding: "6px 12px", borderRadius: 100, background: tone.bgHue, color: tone.hue, fontSize: 14, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase" }}>
                  {l(category.labelTh, category.labelEn)}
                </span>
              )}
              <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>
                {pubDate} · ⏱ {article.readingTimeMinutes} {t("minUnit")} · 👁 {article.viewCount.toLocaleString()} {t("views")}
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(28px, 2.5vw + 16px, 44px)", fontWeight: 800, letterSpacing: "-0.028em", lineHeight: 1.12, margin: "0 0 14px", color: "var(--ink)" }}>
              {title}
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.5, color: "var(--ink-2)", margin: 0, fontWeight: 500 }}>
              {subtitle}
            </p>
          </header>

          {/* Hero / Cover */}
          {article.coverImageUrl ? (
            <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 32, border: "1px solid var(--hairline)" }}>
              <img src={article.coverImageUrl} alt="" style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 32, border: "1px solid var(--hairline)", height: 200, background: `linear-gradient(135deg, ${tone.bgHue}, var(--surface-2))` }} />
          )}

          {/* Body */}
          <ArticleBody body={body} toneColor={tone.hue} toneBg={tone.bgHue} />

          {/* Outro CTA */}
          <div style={{ background: "var(--ink)", color: "#fff", borderRadius: 20, padding: "28px 30px", marginTop: 36, marginBottom: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${tone.hue}, transparent 70%)`, opacity: .4 }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", opacity: .7, marginBottom: 10 }}>
                {t("outroEyebrow")}
              </div>
              {isGuest && article.hasKeyTakeaway ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {[100, 95, 88, 60].map((w, i) => (
                      <div key={i} style={{ width: `${w}%`, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 15, opacity: .7, margin: "0 0 16px" }}>
                    {t("guestTakeawayHint")}
                  </p>
                  <Link href={"/login" as "/"} className="w-btn w-btn-primary" style={{ height: 44, padding: "0 22px", fontSize: 14, textDecoration: "none" }}>
                    {t("guestBannerLogin")}
                  </Link>
                </>
              ) : (
                <>
                  <p
                    style={{ fontSize: 18, lineHeight: 1.6, margin: "0 0 18px" }}
                    dangerouslySetInnerHTML={{
                      __html: (keyTakeaway || (isGuest ? t("guestBannerBody") : t("outroBody")))
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                  {isGuest ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Link href={"/login" as "/"} className="w-btn w-btn-primary" style={{ height: 44, padding: "0 22px", fontSize: 14, textDecoration: "none" }}>
                        {t("guestBannerSignup")}
                      </Link>
                      <Link href={"/login" as "/"} className="w-btn w-btn-ghost" style={{ height: 44, padding: "0 22px", fontSize: 14, textDecoration: "none", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                        {t("guestBannerLogin")}
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Link href={"/" as "/"} className="w-btn w-btn-primary" style={{ height: 44, padding: "0 22px", fontSize: 14, textDecoration: "none" }}>
                        {t("outroCta")}
                      </Link>
                      {keyTakeaway && (
                        <p style={{ fontSize: 14, opacity: .5, marginTop: 14, marginBottom: 0 }}>
                          {tCommon("article")}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>


          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
              {article.tags.map((tag) => (
                <span key={tag} style={{ padding: "6px 12px", borderRadius: 100, background: "#fff", border: "1px solid var(--hairline)", fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Sticky sidebar */}
        <aside style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Table of Contents */}
          {toc.length > 0 && (
            <div className="card" style={{ padding: "18px 20px" }}>
              <div className="w-eyebrow" style={{ marginBottom: 12 }}>{t("tocTitle")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                    style={{
                      textDecoration: "none", display: "flex", gap: 10, padding: "8px 10px", borderRadius: 8,
                      background: activeSection === item.n ? tone.bgHue : "transparent",
                      color: activeSection === item.n ? "var(--ink)" : "var(--ink-2)",
                      fontSize: 14, fontWeight: activeSection === item.n ? 700 : 500,
                    }}
                  >
                    <span style={{ color: activeSection === item.n ? tone.hue : "var(--ink-3)", fontWeight: 800, minWidth: 18 }}>{item.n}.</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
                  </a>
                ))}
              </div>
            </div>
          )}


          {/* Related articles */}
          {related.length > 0 && (
            <div className="card" style={{ padding: "18px 20px" }}>
              <div className="w-eyebrow" style={{ marginBottom: 12 }}>{t("relatedTitle")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {related.map((r) => {
                  const rTone = TONE_MAP[r.tone] ?? TONE_MAP.peach;
                  return (
                    <Link key={r.slug} href={`/articles/${r.slug}` as "/"} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: rTone.hue, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>
                        {l(r.categoryLabelTh, r.categoryLabelEn) || "—"}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                        {l(r.titleTh, r.titleEn)}
                      </div>
                      <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 3 }}>⏱ {r.readingTimeMinutes} {t("minUnit")}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Guest sticky CTA card */}
      {isGuest && (
        <div
          className="guest-cta-bar"
          style={{
            position: "fixed", left: "50%", transform: "translateX(-50%)",
            zIndex: 50, width: "calc(100% - 32px)", maxWidth: 480,
          }}
        >
          <div style={{
            background: "var(--ink)", color: "#fff",
            borderRadius: 18, padding: "16px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -20, left: -20,
              width: 100, height: 100, borderRadius: "50%",
              background: `radial-gradient(circle, ${tone.hue}, transparent 70%)`,
              opacity: 0.3,
            }} />
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                {t("guestCtaBar")}
              </div>
            </div>
            <Link
              href={"/login" as "/"}
              style={{
                flexShrink: 0, height: 38, padding: "0 20px",
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: "#fff", color: "var(--ink)",
                display: "inline-flex", alignItems: "center",
                textDecoration: "none",
              }}
            >
              {t("guestCtaBtn")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
