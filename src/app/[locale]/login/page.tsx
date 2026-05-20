import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getDb } from "@/lib/cf";
import { articles, articleCategories } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";
import { LoginForm } from "@/components/login-form";

const TONE_MAP: Record<string, { hue: string; bgHue: string }> = {
  peach:    { hue: "var(--peach)",    bgHue: "rgba(252,164,91,.14)" },
  lavender: { hue: "#A673F1",        bgHue: "rgba(166,115,241,.14)" },
  mint:     { hue: "#2EA67D",        bgHue: "rgba(133,236,203,.22)" },
  yellow:   { hue: "var(--yellow)",  bgHue: "rgba(253,203,86,.22)" },
  blue:     { hue: "#5C9DBE",        bgHue: "rgba(154,205,226,.28)" },
  purple:   { hue: "#9747FF",        bgHue: "rgba(151,71,255,.14)" },
};

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
      tone: TONE_MAP[r.tone] ?? TONE_MAP.peach,
    }))
  );

  const moreCats = latestRows.slice(3, 5)
    .map(r => r.categoryId ? catMap.get(r.categoryId) : null)
    .filter(Boolean);

  const l = (th: string, en: string) => (locale === "th" ? th : en) || th;

  return (
    <div className="auth-split">
      <div className="auth-brand">
        {/* 1. Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width={28} height={28} viewBox="0 0 32 32">
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
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>DailyMood</span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: ".02em",
            color: "#9747FF", background: "rgba(151,71,255,.10)",
            padding: "5px 10px", borderRadius: 999,
          }}>
            {locale === "th" ? "อ่านฟรี · ไม่ต้องสมัคร" : "Read free · No signup"}
          </span>
        </div>

        {/* 2. Section heading */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" as const, color: "#C56A1F", marginBottom: 8 }}>
            {locale === "th" ? "บทความล่าสุด · Mental health blog" : "Latest · Mental health blog"}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            {locale === "th" ? (<>ลองอ่านก่อน — แล้วค่อย<br />ตัดสินใจสมัคร</>) : (<>Read first — then decide<br />to sign up</>)}
          </h1>
          <p style={{ fontSize: 14, color: "#4A3F55", margin: "10px 0 0", lineHeight: 1.55, maxWidth: 540 }}>
            {locale === "th"
              ? "เนื้อหาจากนักจิตวิทยาและทีม DailyMood · อัปเดตทุกสัปดาห์"
              : "Content from psychologists and the DailyMood team · Updated weekly"}
          </p>
        </div>

        {/* 3. Article list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {featured.map((a, i) => {
            const catLabel = a.category ? l(a.category.labelTh, a.category.labelEn) : "";
            const pubDate = a.publishedAt
              ? new Date(a.publishedAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" })
              : "";
            return (
              <a
                key={a.slug}
                href={`/${locale}/articles/${a.slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "170px 1fr",
                  gap: 18,
                  padding: 14,
                  borderRadius: 16,
                  background: i === 0 ? "#fff" : "transparent",
                  border: `1px solid ${i === 0 ? "rgba(26,19,32,0.08)" : "transparent"}`,
                  boxShadow: i === 0 ? "0 6px 20px -14px rgba(26,19,32,.25)" : "none",
                  textDecoration: "none",
                  color: "inherit",
                  alignItems: "center",
                }}
              >
                {/* Artwork thumbnail */}
                <div style={{
                  width: 170, height: 108, borderRadius: 12, overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: a.coverUrl ? `url(${a.coverUrl}) center/cover` : a.tone.bgHue,
                  flexShrink: 0,
                }} />

                {/* Text */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" as const, color: a.tone.hue, marginBottom: 6 }}>
                    {catLabel} · {a.readingTimeMinutes} {locale === "th" ? "นาที" : "min"}
                  </div>
                  <h3 style={{
                    fontSize: i === 0 ? 19 : 16, fontWeight: 800, margin: 0,
                    letterSpacing: "-0.01em", lineHeight: 1.3,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                  }}>
                    {l(a.titleTh, a.titleEn)}
                  </h3>
                  {i === 0 && (
                    <p style={{
                      fontSize: 13, color: "#4A3F55", margin: "6px 0 0", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>
                      {l(a.excerptTh, a.excerptEn)}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#8C8497", marginTop: 8, fontWeight: 600 }}>
                    <span>{locale === "th" ? "ทีม DailyMood" : "DailyMood Team"}</span>
                    <span style={{ width: 3, height: 3, borderRadius: 99, background: "#8C8497" }} />
                    <span>{pubDate}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* 4. Footer link */}
        <a
          href={`/${locale}/articles`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 18, padding: "14px 18px",
            background: "#fff", border: "1px solid rgba(26,19,32,0.08)",
            borderRadius: 12, textDecoration: "none", color: "#1A1320",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, var(--peach), var(--purple))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18,
            }}>
              📚
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>
                {locale === "th" ? "ดูบทความทั้งหมด" : "See all articles"}
              </div>
              <div style={{ fontSize: 12, color: "#8C8497", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                <span>{totalCount} {locale === "th" ? "บทความ" : "articles"}</span>
                {moreCats.length > 0 && (
                  <>
                    <span style={{ width: 3, height: 3, borderRadius: 99, background: "#8C8497" }} />
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
          <span style={{ fontSize: 18, color: "#9747FF", fontWeight: 700 }}>→</span>
        </a>
      </div>

      <main className="auth-form">
        <LoginForm />
      </main>
    </div>
  );
}
