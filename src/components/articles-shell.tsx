"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

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

const CATEGORY_COLORS: Record<string, string> = {
  basics: "#FCA45B",
  techniques: "#A673F1",
  psychology: "#85ECCB",
  cbt: "#9ACDE2",
  habits: "#FDCB56",
};

function getCategoryColor(slug: string | null): string {
  if (!slug) return "var(--ink-3)";
  return CATEGORY_COLORS[slug] ?? "var(--purple)";
}

export function ArticlesShell() {
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

  const featured = articles[0] ?? null;
  const sidebar = articles.slice(1, 4);
  const rest = articles.slice(4);

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p className="w-eyebrow" style={{ marginBottom: 6 }}>
          {t("eyebrow")}
        </p>
        <h1 style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.6vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          {t("pageTitle")}
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 6, maxWidth: 520 }}>
          {t("pageSubtitle")}
        </p>
      </div>

      {/* Category tabs + search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          <button
            type="button"
            onClick={() => onCategoryChange("")}
            style={{
              padding: "7px 16px",
              borderRadius: 100,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: !activeCategory ? "var(--peach)" : "var(--surface)",
              color: !activeCategory ? "#fff" : "var(--ink-2)",
              boxShadow: !activeCategory ? "none" : "inset 0 0 0 1px var(--hairline)",
            }}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.slug)}
              style={{
                padding: "7px 16px",
                borderRadius: 100,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                background: activeCategory === cat.slug ? "var(--peach)" : "var(--surface)",
                color: activeCategory === cat.slug ? "#fff" : "var(--ink-2)",
                boxShadow: activeCategory === cat.slug ? "none" : "inset 0 0 0 1px var(--hairline)",
              }}
            >
              {l(cat.labelTh, cat.labelEn)}
            </button>
          ))}
        </div>

        {/* Search toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {searchOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="text"
                className="w-input"
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                style={{ width: 220, height: 36, fontSize: 14 }}
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setQuery(""); fetchArticles(activeCategory, ""); }}
                style={{ background: "none", border: "none", fontSize: 14, color: "var(--ink-3)", padding: "6px 8px" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-btn w-btn-ghost"
              style={{ height: 36, fontSize: 14, gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="var(--ink-2)" strokeWidth="2" /><path d="M16 16l4.5 4.5" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" /></svg>
              {t("search")}
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="pulse" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && articles.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{t("emptyTitle")}</p>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 4 }}>{t("emptyBody")}</p>
        </div>
      )}

      {/* Magazine grid */}
      {!loading && featured && (
        <div className="grid-2col" style={{ marginBottom: 32 }}>
          {/* Featured hero */}
          <Link href={`/articles/${featured.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card" style={{ borderRadius: 22, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
              {/* Cover area */}
              <div style={{
                background: featured.coverImageUrl
                  ? `url(${featured.coverImageUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg, #F8EDEB 0%, #E9DEF6 100%)",
                minHeight: 220,
                position: "relative",
                padding: 20,
                display: "flex",
                flexDirection: "column",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 12px", borderRadius: 100,
                    background: "rgba(166,115,241,0.9)", color: "#fff",
                    fontSize: 14, fontWeight: 700,
                  }}>
                    ★ {t("featured")}
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 100,
                    background: "rgba(255,255,255,0.85)", color: "var(--ink-2)",
                    fontSize: 12, fontWeight: 600,
                  }}>
                    ⏱ {featured.readingTimeMinutes} {t("minUnit")}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "20px 24px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                {featured.categoryLabelTh && (
                  <span style={{
                    display: "inline-block", width: "fit-content",
                    padding: "3px 10px", borderRadius: 100,
                    fontSize: 14, fontWeight: 700,
                    background: getCategoryColor(featured.categorySlug) + "18",
                    color: getCategoryColor(featured.categorySlug),
                    marginBottom: 10,
                  }}>
                    {l(featured.categoryLabelTh, featured.categoryLabelEn)}
                  </span>
                )}
                <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, margin: 0, marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {l(featured.titleTh, featured.titleEn)}
                </h2>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {l(featured.excerptTh, featured.excerptEn)}
                </p>
              </div>
            </div>
          </Link>

          {/* Sidebar stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sidebar.map((article) => (
              <SidebarCard key={article.id} article={article} locale={locale} l={l} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Remaining articles grid */}
      {!loading && rest.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 8 }}>
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} l={l} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarCard({
  article,
  locale,
  l,
  t,
}: {
  article: ArticleItem;
  locale: string;
  l: (th: string | null, en: string | null) => string;
  t: (key: string) => string;
}) {
  const catColor = getCategoryColor(article.categorySlug);
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" })
    : "";

  return (
    <Link href={`/articles/${article.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card" style={{ borderRadius: 18, padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Icon circle */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: article.coverImageUrl ? `url(${article.coverImageUrl}) center/cover` : `${catColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!article.coverImageUrl && (
            <span style={{ fontSize: 22 }}>📖</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {article.categoryLabelTh && (
            <span style={{
              fontSize: 14, fontWeight: 700, color: catColor,
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}>
              {l(article.categoryLabelTh, article.categoryLabelEn)}
            </span>
          )}
          <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, margin: "2px 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {l(article.titleTh, article.titleEn)}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)" }}>
            {pubDate && <span>{pubDate}</span>}
            <span>⏱ {article.readingTimeMinutes} {t("minUnit")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({
  article,
  locale,
  l,
  t,
}: {
  article: ArticleItem;
  locale: string;
  l: (th: string | null, en: string | null) => string;
  t: (key: string) => string;
}) {
  const catColor = getCategoryColor(article.categorySlug);
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" })
    : "";

  return (
    <Link href={`/articles/${article.slug}` as "/"} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card" style={{ borderRadius: 18, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
        {article.coverImageUrl && (
          <div style={{ height: 140, background: `url(${article.coverImageUrl}) center/cover`, flexShrink: 0 }} />
        )}
        <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
          {article.categoryLabelTh && (
            <span style={{
              display: "inline-block", width: "fit-content",
              padding: "2px 8px", borderRadius: 100,
              fontSize: 14, fontWeight: 700,
              background: catColor + "18",
              color: catColor,
              marginBottom: 8,
            }}>
              {l(article.categoryLabelTh, article.categoryLabelEn)}
            </span>
          )}
          <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {l(article.titleTh, article.titleEn)}
          </h3>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {l(article.excerptTh, article.excerptEn)}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)", marginTop: 12 }}>
            {pubDate && <span>{pubDate}</span>}
            <span>⏱ {article.readingTimeMinutes} {t("minUnit")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
