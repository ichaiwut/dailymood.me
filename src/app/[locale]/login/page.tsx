import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getDb } from "@/lib/cf";
import { articles, articleCategories } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";
import { LoginForm } from "@/components/login-form";
import { MobileLoginFeed } from "@/components/mobile-login-feed";
import { PAClip, PAMark, ArticleArt, toneHue, toneBg } from "@/components/paper";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const locale = await getLocale();
    redirect({ href: "/", locale });
  }

  const locale = await getLocale();
  const db = getDb();

  const latestRows = await db
    .select({
      slug: articles.slug,
      titleTh: articles.titleTh,
      titleEn: articles.titleEn,
      excerptTh: articles.excerptTh,
      excerptEn: articles.excerptEn,
      coverImageKey: articles.coverImageKey,
      categoryId: articles.categoryId,
      tone: articles.tone,
      readingTimeMinutes: articles.readingTimeMinutes,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.publishedAt))
    .limit(5);

  const catIds = [...new Set(latestRows.filter(r => r.categoryId).map(r => r.categoryId!))];
  const catMap = new Map<string, { labelTh: string; labelEn: string; slug: string }>();
  if (catIds.length > 0) {
    const catRows = await db.select().from(articleCategories)
      .where(sql`${articleCategories.id} IN (${sql.join(catIds.map(id => sql`${id}`), sql`, `)})`);
    catRows.forEach(c => catMap.set(c.id, c));
  }

  const [totalRows] = await db.select({ c: sql<number>`count(*)::int` }).from(articles).where(eq(articles.published, true));
  const totalCount = totalRows?.c ?? latestRows.length;

  const featured = await Promise.all(
    latestRows.slice(0, 3).map(async (r) => ({
      ...r,
      coverUrl: r.coverImageKey ? await getSignedReadUrl(r.coverImageKey) : null,
      category: r.categoryId ? catMap.get(r.categoryId) : null,
    }))
  );

  const moreCats = latestRows.slice(3, 5)
    .map(r => r.categoryId ? catMap.get(r.categoryId) : null)
    .filter(Boolean);

  const l = (th: string, en: string) => (locale === "th" ? th : en) || th;

  const TILT = [-0.7, 0.6, -0.5];

  return (
    <>
    <div className="auth-split pa-wrap">
      <div className="auth-brand" style={{ background: "var(--bg)" }}>
        {/* 1. Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width={30} height={30} viewBox="0 0 32 32">
              <defs>
                <linearGradient id="dmlg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FCA45B" /><stop offset=".5" stopColor="#FBA0A0" /><stop offset="1" stopColor="#A673F1" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#dmlg)" />
              <circle cx="12" cy="14" r="1.6" fill="#1A1320" />
              <circle cx="20" cy="14" r="1.6" fill="#1A1320" />
              <path d="M 11 20 Q 16 24 21 20" stroke="#1A1320" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em", color: "var(--ink)" }}>DailyMood</span>
          </div>
          <span style={{
            fontSize: 14, fontWeight: 800, letterSpacing: "-.01em",
            color: "var(--purple-strong)", background: "var(--w-surface)",
            padding: "7px 14px", borderRadius: 999,
            boxShadow: "0 6px 16px -8px rgba(60,40,20,.3)",
          }}>
            {locale === "th" ? "อ่านฟรี · ไม่ต้องสมัคร" : "Read free · No signup"}
          </span>
        </div>

        {/* 2. Section heading — loose on the desk (theme ink, dark-safe) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" as const, color: "var(--ink-3)", marginBottom: 10 }}>
            {locale === "th" ? "บทความล่าสุด · บล็อกสุขภาพใจ" : "Latest · Mental health blog"}
          </div>
          <h1 style={{ fontSize: "clamp(28px, 3vw, 34px)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.18, color: "var(--ink)" }}>
            {locale === "th"
              ? (<>ลองอ่านก่อน — แล้วค่อย<br /><PAMark color="var(--peach)">ตัดสินใจสมัคร</PAMark></>)
              : (<>Read first — then <PAMark color="var(--peach)">decide</PAMark><br />to sign up</>)}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-2)", margin: "12px 0 0", lineHeight: 1.55, maxWidth: 540 }}>
            {locale === "th"
              ? "บทความดูแลสุขภาพใจ · อัปเดตทุกสัปดาห์"
              : "Mental health articles · Updated weekly"}
          </p>
        </div>

        {/* 3. Article clippings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {featured.map((a, i) => {
            const catLabel = a.category ? l(a.category.labelTh, a.category.labelEn) : "";
            const pubDate = a.publishedAt
              ? new Date(a.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" })
              : "";
            const hue = toneHue(a.tone);
            const bg = toneBg(a.tone);
            return (
              <a key={a.slug} href={`/articles/${a.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <article
                  className="pa-sheet pa-card-lift"
                  style={{ padding: 14, display: "flex", gap: 16, alignItems: "flex-start", transform: `rotate(${TILT[i] ?? 0}deg)`, overflow: "visible" }}
                >
                  <PAClip style={{ top: -15, left: 28, zIndex: 4 }} />

                  {/* framed cover */}
                  <div style={{
                    width: 150, height: 100, borderRadius: 12, flexShrink: 0,
                    overflow: "hidden", background: bg,
                    border: "3px solid #fff", boxShadow: "0 8px 18px -10px rgba(60,40,20,.5)",
                  }}>
                    {a.coverUrl
                      ? <div style={{ width: "100%", height: "100%", background: `url(${a.coverUrl}) center/cover` }} />
                      : <ArticleArt tone={a.tone} />}
                  </div>

                  {/* text */}
                  <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".03em", textTransform: "uppercase" as const, color: hue, marginBottom: 6 }}>
                      {catLabel}{catLabel && " · "}{a.readingTimeMinutes} {locale === "th" ? "นาที" : "min"}
                    </div>
                    <h3 style={{
                      fontSize: i === 0 ? 18 : 16, fontWeight: 800, margin: 0, color: "var(--w-ink)",
                      letterSpacing: "-0.01em", lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>
                      {l(a.titleTh, a.titleEn)}
                    </h3>
                    {i === 0 && (
                      <p style={{
                        fontSize: 14, color: "var(--w-ink-2)", margin: "6px 0 0", lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                      }}>
                        {l(a.excerptTh, a.excerptEn)}
                      </p>
                    )}
                    <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 8, fontWeight: 600 }}>
                      {pubDate}
                    </div>
                  </div>
                </article>
              </a>
            );
          })}
        </div>

        {/* 4. See-all folder */}
        <a href={"/articles"} style={{ textDecoration: "none", color: "inherit", marginTop: 20, display: "block" }}>
          <div className="pa-sheet pa-card-lift" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: "linear-gradient(135deg, var(--peach), var(--purple))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 19, flexShrink: 0,
              }}>
                📚
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--w-ink)" }}>
                  {locale === "th" ? "ดูบทความทั้งหมด" : "See all articles"}
                </div>
                <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 2, display: "flex", gap: 6, alignItems: "center", fontWeight: 600 }}>
                  <span>{totalCount} {locale === "th" ? "บทความ" : "articles"}</span>
                  {moreCats.length > 0 && (
                    <>
                      <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--w-ink-3)" }} />
                      {moreCats.map((c, i) => (
                        <span key={i}>
                          {i > 0 && " · "}{c ? l(c.labelTh, c.labelEn) : ""}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 18, color: "var(--purple-strong)", fontWeight: 800 }}>→</span>
          </div>
        </a>
      </div>

      <main className="auth-form" style={{ background: "var(--bg)" }}>
        <LoginForm />
      </main>
    </div>

    {/* Mobile: articles-first feed + sticky CTA */}
    <MobileLoginFeed
      articles={featured.map((a) => ({
        slug: a.slug,
        title: l(a.titleTh, a.titleEn),
        excerpt: l(a.excerptTh, a.excerptEn),
        coverUrl: a.coverUrl,
        tone: a.tone,
        categoryLabel: a.category ? l(a.category.labelTh, a.category.labelEn) : "",
        readingMinutes: a.readingTimeMinutes,
        publishedDate: a.publishedAt
          ? new Date(a.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" })
          : "",
        toneHue: toneHue(a.tone),
        toneBg: toneBg(a.tone),
      }))}
      totalCount={totalCount}
    />
    </>
  );
}
