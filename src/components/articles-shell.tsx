"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArticleArt, PAClip, PASticker, PAMark, toneHue, toneMoodId } from "@/components/paper";

interface ArticleItem {
  id: string;
  slug: string;
  titleTh: string;
  titleEn: string;
  excerptTh: string;
  excerptEn: string;
  coverImageUrl: string | null;
  categoryId: string | null;
  categoryLabelTh: string | null;
  categoryLabelEn: string | null;
  categorySlug: string | null;
  tone: string;
  readingTimeMinutes: number;
  publishedAt: string | null;
}

interface Category {
  id: string;
  slug: string;
  labelTh: string;
  labelEn: string;
  order: number;
}

const WASHI = ["mint", "lav", "yellow"] as const;

export function ArticlesShell({ isGuest = false }: { isGuest?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("articles");

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);

  function fetchArticles(cat: string, q: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (q) params.set("q", q);
    fetch(`/api/articles?${params}`)
      .then((r) => r.json() as Promise<{ articles?: ArticleItem[]; categories?: Category[] }>)
      .then((data) => {
        setArticles(data.articles ?? []);
        if (data.categories) setCategories(data.categories);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchArticles("", "");
  }, []);

  function onCategoryChange(slug: string) {
    setActiveCategory(slug);
    fetchArticles(slug, query);
  }

  function onSearchChange(val: string) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchArticles(activeCategory, val);
    }, 300);
  }

  const l = (th: string | null, en: string | null) => (locale === "th" ? th : en) || th || en || "";
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" }) : "";

  const featured = articles[0] ?? null;
  const sidebar = articles.slice(1, 4);
  const rest = articles.slice(4);

  return (
    <section className="pa-wrap fade-in" style={{ padding: "clamp(20px, 4vw, 36px) 0 40px", marginBottom: 24, position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
        <div>
          <span className="pa-chip" style={{ marginBottom: 14 }}>📚 {t("eyebrow")}</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "14px 0 0", letterSpacing: "-0.02em", lineHeight: 1.05, color: "var(--ink)" }}>
            {t("titlePre")}
            <PAMark><span style={{ color: "#1A1320" }}>{t("titleMark")}</span></PAMark>
            {t("titlePost")}
          </h1>
        </div>

        {/* Filter pills + search */}
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", maxWidth: "100%", overflowX: "auto" }}>
          <button type="button" className={`pa-filter${!activeCategory ? " active" : ""}`} onClick={() => onCategoryChange("")}>
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pa-filter${activeCategory === cat.slug ? " active" : ""}`}
              onClick={() => onCategoryChange(cat.slug)}
            >
              {l(cat.labelTh, cat.labelEn)}
            </button>
          ))}

          {searchOpen ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                style={{ width: 200, height: 38, borderRadius: 11, border: "none", padding: "0 14px", fontSize: 13, fontWeight: 600, background: "#fff", color: "var(--w-ink)", boxShadow: "0 5px 14px -8px rgba(60,40,20,.4)", outline: "none" }}
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setQuery(""); fetchArticles(activeCategory, ""); }}
                aria-label={locale === "th" ? "ปิดการค้นหา" : "Close search"}
                style={{ background: "none", border: "none", fontSize: 16, color: "var(--w-ink-3)", padding: "6px 8px", cursor: "pointer" }}
              >
                ✕
              </button>
            </span>
          ) : (
            <button type="button" className="pa-filter" onClick={() => setSearchOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" /><path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
              {t("search")}
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="pulse" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(26,19,32,.08)" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && articles.length === 0 && (
        <div className="pa-sheet" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--w-ink)", margin: 0 }}>{t("emptyTitle")}</p>
          <p style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 4 }}>{t("emptyBody")}</p>
        </div>
      )}

      {/* Featured + side stack */}
      {!loading && featured && (
        <div className="pa-grid" style={{ marginBottom: rest.length > 0 ? 26 : 0 }}>
          {/* Featured folder */}
          <div style={{ position: "relative" }}>
            <span className="pa-tab">★ {t("featured")}</span>
            <Link href={`/articles/${featured.slug}` as "/"} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <article className="pa-sheet pa-card-lift" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <PAClip style={{ top: -15, right: 34, transform: "rotate(8deg)", zIndex: 8 }} />
                <div style={{ position: "relative", margin: 14, marginBottom: 0, borderRadius: 14, overflow: "hidden", aspectRatio: "16 / 10" }}>
                  <Cover article={featured} />
                  <span style={{ position: "absolute", top: 14, right: 14, padding: "6px 12px", borderRadius: 100, background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 800, color: "var(--w-ink-2)" }}>
                    ⏱ {featured.readingTimeMinutes} {t("minUnit")}
                  </span>
                </div>
                <div style={{ padding: "22px 26px 24px", display: "flex", flexDirection: "column" }}>
                  {featured.categoryLabelTh && (
                    <div style={{ fontSize: 12, fontWeight: 800, color: toneHue(featured.tone), marginBottom: 9, textTransform: "uppercase", letterSpacing: ".08em" }}>
                      {l(featured.categoryLabelTh, featured.categoryLabelEn)}
                    </div>
                  )}
                  <h2 style={{ fontSize: "clamp(20px, 2.2vw, 26px)", fontWeight: 800, lineHeight: 1.22, margin: "0 0 12px", color: "var(--w-ink)", letterSpacing: "-0.018em" }}>
                    {l(featured.titleTh, featured.titleEn)}
                  </h2>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--w-ink-2)", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {l(featured.excerptTh, featured.excerptEn)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--w-rule)" }}>
                    <PASticker moodId={toneMoodId(featured.tone)} color={toneHue(featured.tone)} size={42} style={{ transform: "rotate(-6deg)" }} />
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--w-ink-3)" }}>
                      {fmtDate(featured.publishedAt)}
                    </div>
                    <span className="pa-btn purple">{t("readMore")} →</span>
                  </div>
                </div>
              </article>
            </Link>
          </div>

          {/* Side stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {sidebar.map((a, i) => (
              <Link key={a.id} href={`/articles/${a.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
                <article className="pa-sheet pa-card-lift" style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "132px 1fr", borderRadius: "4px 14px 14px 14px", transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)` }}>
                  <span className={`pa-washi ${WASHI[i % WASHI.length]}`} style={{ left: 90, width: 80 }} />
                  <div style={{ position: "relative", overflow: "hidden", minHeight: 120 }}>
                    <Cover article={a} />
                    <PASticker moodId={toneMoodId(a.tone)} color={toneHue(a.tone)} size={34} borderWidth={3} style={{ position: "absolute", bottom: 8, left: 8, transform: "rotate(-8deg)" }} />
                  </div>
                  <div style={{ padding: "15px 17px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                    <div>
                      {a.categoryLabelTh && (
                        <div style={{ fontSize: 10, fontWeight: 800, color: toneHue(a.tone), textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                          {l(a.categoryLabelTh, a.categoryLabelEn)}
                        </div>
                      )}
                      <h3 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, margin: 0, color: "var(--w-ink)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {l(a.titleTh, a.titleEn)}
                      </h3>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--w-ink-3)", marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      {fmtDate(a.publishedAt) && (
                        <>
                          <span>{fmtDate(a.publishedAt)}</span>
                          <span style={{ width: 3, height: 3, borderRadius: 50, background: "var(--w-ink-3)" }} />
                        </>
                      )}
                      <span>⏱ {a.readingTimeMinutes} {t("minUnit")}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Remaining articles */}
      {!loading && rest.length > 0 && (
        <div className="pa-rest-grid">
          {rest.map((a, i) => (
            <Link key={a.id} href={`/articles/${a.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
              <article className="pa-sheet pa-card-lift" style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)` }}>
                <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16 / 9" }}>
                  <Cover article={a} />
                  <PASticker moodId={toneMoodId(a.tone)} color={toneHue(a.tone)} size={36} borderWidth={3} style={{ position: "absolute", bottom: -6, right: 12, transform: "rotate(-8deg)" }} />
                </div>
                <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {a.categoryLabelTh && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: toneHue(a.tone), textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {l(a.categoryLabelTh, a.categoryLabelEn)}
                    </div>
                  )}
                  <h3 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, margin: 0, color: "var(--w-ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {l(a.titleTh, a.titleEn)}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--w-ink-2)", lineHeight: 1.5, margin: 0, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {l(a.excerptTh, a.excerptEn)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed var(--w-rule)" }}>
                    <span style={{ fontSize: 11, color: "var(--w-ink-3)", fontWeight: 700 }}>⏱ {a.readingTimeMinutes} {t("minUnit")}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: toneHue(a.tone) }}>{t("readMore")} →</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/** Cover fill — real photo if present, else a tone-based ArticleArt illustration. */
function Cover({ article }: { article: ArticleItem }) {
  if (article.coverImageUrl) {
    return <div style={{ position: "absolute", inset: 0, background: `url(${article.coverImageUrl}) center/cover no-repeat` }} />;
  }
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ArticleArt tone={article.tone} />
    </div>
  );
}
