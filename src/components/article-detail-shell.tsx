"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArticleBody } from "./article-body";
import { ArticleArt, PAClip, PASticker, toneHue, toneBg, toneMoodId, asTone } from "@/components/paper";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { trackArticleView, trackArticleBookmark, trackArticleShare, trackArticleReaction, trackArticleReadComplete } from "@/lib/analytics";

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

// Post-read reaction offers the first 5 system moods; colours are pulled from
// DEFAULT_MOODS so there's a single source of truth for the palette.
const REACTION_MOOD_IDS = ["amazing", "happy", "neutral", "sad", "tired"] as const;
const REACTION_MOODS = REACTION_MOOD_IDS.map((id) => ({
  id,
  color: DEFAULT_MOODS.find((m) => m.id === id)?.color ?? "var(--peach)",
}));

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

/** Paper-pill button (top bar). */
const paperPill: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 15px",
  borderRadius: 11, background: "var(--w-surface)", border: "none",
  boxShadow: "0 5px 14px -8px rgba(60,40,20,.4)", fontFamily: "inherit",
  fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)", cursor: "pointer", textDecoration: "none",
};

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "#e53e3e" : "none"} aria-hidden>
      <path d="M12 20S4 14 4 9A4 4 0 0 1 12 7A4 4 0 0 1 20 9C20 14 12 20 12 20Z" stroke={filled ? "#e53e3e" : "currentColor"} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12M12 3l-4 4M12 3l4 4M5 12v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const readCompleteTracked = useRef(false);

  const l = useCallback((th: string | null, en: string | null) =>
    (locale === "th" ? th : en) || th || en || "",
  [locale]);

  const moodLabel = useCallback((id: string) => {
    const m = DEFAULT_MOODS.find((x) => x.id === id);
    return m ? (locale === "th" ? m.labelTh : m.label) : id;
  }, [locale]);

  useEffect(() => {
    fetch(`/api/articles/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json() as Promise<{
          article: Article;
          category: Category | null;
          bookmarked: boolean;
          reaction: string | null;
          saveCount: number;
          related: RelatedArticle[];
        }>;
      })
      .then((data) => {
        if (!data) return;
        setArticle(data.article);
        setCategory(data.category);
        setBookmarked(data.bookmarked);
        setReactionMood(data.reaction);
        setSaveCount(data.saveCount);
        setRelated(data.related);
        setLoading(false);
        trackArticleView(slug, data.category?.slug);
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
      const scrollable = total - window.innerHeight;
      // Article shorter than the viewport: nothing to scroll → treat as 100%
      // once any scroll happens, 0 otherwise (avoids 0/0 = NaN).
      const ratio = scrollable > 0 ? scrolled / scrollable : scrolled > 0 ? 1 : 0;
      setProgress(Math.min(1, Math.max(0, ratio)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading]);

  useEffect(() => {
    if (progress >= 0.9 && !readCompleteTracked.current) {
      readCompleteTracked.current = true;
      trackArticleReadComplete(slug);
    }
  }, [progress, slug]);

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
    let removeListener: (() => void) | null = null;
    const timer = setTimeout(() => {
      updateActiveSection();
      window.addEventListener("scroll", updateActiveSection, { passive: true });
      removeListener = () => window.removeEventListener("scroll", updateActiveSection);
    }, 150);
    return () => { clearTimeout(timer); removeListener?.(); };
  }, [loading, article]);

  async function toggleBookmark() {
    if (isGuest) return;
    const method = bookmarked ? "DELETE" : "POST";
    setBookmarked(!bookmarked);
    setSaveCount((c) => c + (bookmarked ? -1 : 1));
    trackArticleBookmark(slug, !bookmarked);
    await fetch(`/api/articles/${slug}/bookmark`, { method });
  }

  async function shareArticle() {
    const url = window.location.href;
    const title = article ? l(article.titleTh, article.titleEn) : "";
    trackArticleShare(slug);
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert(t("linkCopied"));
    }
  }

  async function reactMood(moodId: string) {
    if (reactionMood === moodId) return; // already selected — no-op (avoids duplicate POST)
    setReactionMood(moodId); // visual feedback for everyone
    if (isGuest) return;     // persistence + tracking only for logged-in users
    trackArticleReaction(slug, moodId);
    await fetch(`/api/articles/${slug}/reaction`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ moodTypeId: moodId }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <section className="pa-wrap" style={{ padding: "60px 0", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", padding: 40, position: "relative", zIndex: 1 }}>
          <div className="pulse" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(26,19,32,.08)" }} />
        </div>
      </section>
    );
  }

  if (notFound || !article) {
    return (
      <section className="pa-wrap fade-in" style={{ padding: "60px 20px", marginBottom: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "var(--ink)" }}>{t("notFoundTitle")}</h2>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 20 }}>{t("notFoundBody")}</p>
          <Link href={"/articles" as "/"} className="pa-btn ink" style={{ textDecoration: "none" }}>
            {t("backToArticles")}
          </Link>
        </div>
      </section>
    );
  }

  const hue = toneHue(article.tone);
  const bgHue = toneBg(article.tone);
  const tabText = asTone(article.tone) === "yellow" ? "var(--w-ink)" : "#fff";
  const title = l(article.titleTh, article.titleEn);
  const subtitle = l(article.excerptTh, article.excerptEn);
  const rawBody = l(article.bodyTh, article.bodyEn);

  const hrIdx = rawBody.lastIndexOf("\n---");
  const body = hrIdx >= 0 ? rawBody.slice(0, hrIdx).trim() : rawBody;
  const keyTakeaway = l(article.keyTakeawayTh, article.keyTakeawayEn);

  const toc = parseHeadings(body);
  const pct = Math.round(progress * 100);
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <section className="pa-wrap fade-in" style={{ padding: "clamp(16px, 3vw, 28px) 0 56px", marginBottom: 24, position: "relative" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px, 3vw, 32px)", position: "relative", zIndex: 1 }}>
        {/* Top action bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 22px", gap: 12, flexWrap: "wrap" }}>
          <Link href={"/articles" as "/"} style={{ color: "var(--ink-2)", textDecoration: "none", fontSize: 14, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
            ← {t("backToArticles")}
          </Link>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isGuest ? (
              <span style={{ ...paperPill, cursor: "default", color: "var(--w-ink-3)" }}>
                <HeartIcon /> {t("guestBookmarkHint")}
              </span>
            ) : (
              <button type="button" style={paperPill} onClick={toggleBookmark} aria-pressed={bookmarked}>
                <HeartIcon filled={bookmarked} /> {t("save")} ({saveCount})
              </button>
            )}
            <button type="button" style={paperPill} onClick={shareArticle}>
              <ShareIcon /> {t("share")}
            </button>
          </div>
        </div>

        {/* Two-column layout (base grid + responsive collapse live in .article-grid) */}
        <div className="article-grid">
          {/* Main article */}
          <article ref={articleRef} style={{ position: "relative", minWidth: 0 }}>
            {/* Header */}
            <header style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 700, marginBottom: 16 }}>
                {pubDate ? `${pubDate} · ` : ""}⏱ {article.readingTimeMinutes} {t("minUnit")} · 👁 {article.viewCount.toLocaleString()} {t("views")}
              </div>
              <h1 style={{ fontSize: "clamp(28px, 2.5vw + 16px, 44px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.14, margin: "0 0 14px", color: "var(--ink)" }}>
                {title}
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.5, color: "var(--ink-2)", margin: 0, fontWeight: 500 }}>
                {subtitle}
              </p>
            </header>

            {/* Hero folder */}
            <div style={{ position: "relative", marginBottom: 34 }}>
              {category && (
                <span className="pa-tab" style={{ background: hue, color: tabText }}>
                  {l(category.labelTh, category.labelEn)}
                </span>
              )}
              <div className="pa-sheet" style={{ overflow: "hidden", borderRadius: "4px 18px 18px 18px" }}>
                <PAClip style={{ top: -15, right: 42, transform: "rotate(8deg)", zIndex: 8 }} />
                <div style={{ margin: 14, borderRadius: 14, overflow: "hidden", position: "relative" }}>
                  {article.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.coverImageUrl} alt="" style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9" }}>
                      <ArticleArt tone={article.tone} />
                    </div>
                  )}
                </div>
              </div>
              <PASticker
                moodId={toneMoodId(article.tone)}
                color={hue}
                size={58}
                style={{ position: "absolute", bottom: -16, left: -14, transform: "rotate(-10deg)", zIndex: 9 }}
              />
            </div>

            {/* Body */}
            <ArticleBody body={body} toneColor={hue} toneBg={bgHue} variant="paper" />

            {/* Outro — dark plum folder */}
            <div style={{ position: "relative", marginTop: 36, marginBottom: 32 }}>
              <span className="pa-tab ink">{t("outroEyebrow")}</span>
              <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", background: "linear-gradient(155deg,#2A1F33,#1A1320)", color: "#fff", padding: "30px 32px", overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 170, height: 170, borderRadius: "50%", background: `radial-gradient(circle, ${hue}, transparent 70%)`, opacity: .4 }} aria-hidden />
                <PASticker moodId="amazing" color="#fff" size={46} style={{ position: "absolute", top: 20, right: 26, transform: "rotate(10deg)", zIndex: 1 }} />
                <div style={{ position: "relative", maxWidth: "82%" }}>
                  {isGuest && article.hasKeyTakeaway ? (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                        {[100, 95, 88, 60].map((w, i) => (
                          <div key={i} style={{ width: `${w}%`, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.1)" }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 15, opacity: .7, margin: "0 0 16px" }}>{t("guestTakeawayHint")}</p>
                      <Link href={"/login" as "/"} className="pa-btn" style={{ textDecoration: "none" }}>
                        {t("guestBannerLogin")}
                      </Link>
                    </>
                  ) : (
                    <>
                      <p
                        style={{ fontSize: 18, lineHeight: 1.65, margin: "0 0 20px" }}
                        dangerouslySetInnerHTML={{
                          __html: (keyTakeaway || (isGuest ? t("guestBannerBody") : t("outroBody")))
                            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                        }}
                      />
                      {isGuest ? (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Link href={"/login" as "/"} className="pa-btn" style={{ textDecoration: "none" }}>
                            {t("guestBannerSignup")}
                          </Link>
                          <Link
                            href={"/login" as "/"}
                            className="pa-btn"
                            style={{ textDecoration: "none", background: "transparent", color: "#fff", boxShadow: "none", border: "1px solid rgba(255,255,255,0.35)" }}
                          >
                            {t("guestBannerLogin")}
                          </Link>
                        </div>
                      ) : (
                        <>
                          <Link href={"/" as const} className="pa-btn" style={{ textDecoration: "none" }}>
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
            </div>

            {/* Reading reaction — paper card with clip + sticker buttons */}
            <div className="pa-sheet" style={{ borderRadius: 16, padding: "24px 26px", marginBottom: 28, position: "relative" }}>
              <PAClip style={{ top: -15, left: 30, transform: "rotate(-8deg)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3, color: "var(--w-ink)" }}>{t("reactionTitle")}</div>
                  <div style={{ fontSize: 14, color: "var(--w-ink-2)" }}>{t("reactionSubtitle")}</div>
                </div>
                <div role="group" aria-label={t("reactionTitle")} style={{ display: "flex", gap: 10 }}>
                  {REACTION_MOODS.map((m) => {
                    const selected = reactionMood === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => reactMood(m.id)}
                        aria-pressed={selected}
                        aria-label={moodLabel(m.id)}
                        style={{
                          border: "none", background: "transparent", cursor: "pointer", padding: 0,
                          transform: selected ? "scale(1.12) rotate(-6deg)" : "none",
                          transition: "transform .15s ease",
                        }}
                      >
                        <PASticker
                          moodId={m.id}
                          color={selected ? m.color : "#fff"}
                          size={46}
                          style={{ boxShadow: selected ? `0 10px 20px -6px ${m.color}` : "0 6px 14px -7px rgba(0,0,0,.3)" }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {article.tags.map((tag) => (
                  <span key={tag} style={{ padding: "6px 12px", borderRadius: 100, background: "var(--w-surface)", boxShadow: "0 5px 14px -9px rgba(60,40,20,.5)", fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          {/* Sticky sidebar */}
          <aside style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Table of Contents + progress */}
            {toc.length > 0 && (
              <div style={{ position: "relative" }}>
                <span className="pa-tab ink" style={{ fontSize: 14, padding: "8px 16px 10px" }}>{t("tocTitle")}</span>
                <div className="pa-sheet" style={{ borderRadius: "4px 14px 14px 14px", padding: "16px 18px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {toc.map((item) => {
                      const active = activeSection === item.n;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                          style={{
                            textDecoration: "none", display: "flex", gap: 10, padding: "8px 10px", borderRadius: 9,
                            background: active ? bgHue : "transparent",
                            color: active ? "var(--w-ink)" : "var(--w-ink-2)",
                            fontSize: 14, fontWeight: active ? 800 : 600,
                          }}
                        >
                          <span style={{ color: active ? hue : "var(--w-ink-3)", fontWeight: 800, minWidth: 18 }}>{item.n}.</span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
                        </a>
                      );
                    })}
                  </div>
                  {/* Reading progress */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--w-rule)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "var(--w-ink-3)", marginBottom: 6 }}>
                      <span>{t("progress")}</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 100, background: "var(--w-rule)" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 100, background: hue, transition: "width .15s ease" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Related articles */}
            {related.length > 0 && (
              <div style={{ position: "relative" }}>
                <span className="pa-tab mint" style={{ fontSize: 14, padding: "8px 16px 10px" }}>{t("relatedTitle")}</span>
                <div className="pa-sheet" style={{ borderRadius: "4px 14px 14px 14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {related.map((r) => {
                    const rHue = toneHue(r.tone);
                    return (
                      <Link key={r.slug} href={`/articles/${r.slug}` as "/"} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: rHue, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>
                          {l(r.categoryLabelTh, r.categoryLabelEn) || "—"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: "var(--w-ink)" }}>
                          {l(r.titleTh, r.titleEn)}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 3 }}>⏱ {r.readingTimeMinutes} {t("minUnit")}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
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
            background: "var(--w-ink)", color: "var(--bg)",
            borderRadius: 18, padding: "16px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -20, left: -20,
              width: 100, height: 100, borderRadius: "50%",
              background: `radial-gradient(circle, ${hue}, transparent 70%)`,
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
                background: "var(--w-surface)", color: "var(--w-ink)",
                display: "inline-flex", alignItems: "center",
                textDecoration: "none",
              }}
            >
              {t("guestCtaBtn")}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
