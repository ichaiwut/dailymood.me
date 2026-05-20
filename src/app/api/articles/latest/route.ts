import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { articles, articleCategories } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";

const ALLOWED_ORIGINS = [
  "https://dailymood.me",
  "https://www.dailymood.me",
];

function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return null;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = getAllowedOrigin(req);
  if (!origin) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = getAllowedOrigin(req);

  try {
    const db = getDb();

    const rows = await db
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
      .limit(3);

    const categoryIds = [...new Set(rows.map((r) => r.categoryId).filter(Boolean))] as string[];
    const cats =
      categoryIds.length > 0
        ? await db.select().from(articleCategories).where(inArray(articleCategories.id, categoryIds))
        : [];
    const catMap = new Map(cats.map((c) => [c.id, c]));

    const items = await Promise.all(
      rows.map(async (r) => {
        const cat = r.categoryId ? catMap.get(r.categoryId) : null;
        return {
          slug: r.slug,
          titleTh: r.titleTh,
          titleEn: r.titleEn,
          excerptTh: r.excerptTh,
          excerptEn: r.excerptEn,
          coverImageUrl: r.coverImageKey ? await getSignedReadUrl(r.coverImageKey) : null,
          categoryLabelTh: cat?.labelTh ?? null,
          categoryLabelEn: cat?.labelEn ?? null,
          categorySlug: cat?.slug ?? null,
          tone: r.tone,
          readingTimeMinutes: r.readingTimeMinutes,
          publishedAt: r.publishedAt,
        };
      }),
    );

    const headers: Record<string, string> = {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
    };
    if (origin) Object.assign(headers, corsHeaders(origin));

    return NextResponse.json({ articles: items }, { headers });
  } catch (err) {
    console.error("[articles/latest] GET failed:", err);
    const headers: Record<string, string> = {};
    if (origin) Object.assign(headers, corsHeaders(origin));
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers });
  }
}
