import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles, articleCategories } from "@/db/schema";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const categorySlug = url.searchParams.get("category") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10)));

  const db = getDb();

  const [cats, categoryMap] = await (async () => {
    const rows = await db.select().from(articleCategories).orderBy(asc(articleCategories.order));
    const map = new Map(rows.map((c) => [c.id, c]));
    return [rows, map] as const;
  })();

  const conditions = [eq(articles.published, true)];

  if (categorySlug) {
    const cat = cats.find((c) => c.slug === categorySlug);
    if (cat) conditions.push(eq(articles.categoryId, cat.id));
  }

  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(articles.titleTh, pattern),
        ilike(articles.titleEn, pattern),
        ilike(articles.excerptTh, pattern),
        ilike(articles.excerptEn, pattern),
      )!,
    );
  }

  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      titleTh: articles.titleTh,
      titleEn: articles.titleEn,
      excerptTh: articles.excerptTh,
      excerptEn: articles.excerptEn,
      coverImageKey: articles.coverImageKey,
      categoryId: articles.categoryId,
      readingTimeMinutes: articles.readingTimeMinutes,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const items = await Promise.all(
    rows.map(async (r) => {
      const cat = r.categoryId ? categoryMap.get(r.categoryId) : null;
      return {
        ...r,
        coverImageUrl: r.coverImageKey ? await getSignedReadUrl(r.coverImageKey) : null,
        coverImageKey: undefined,
        categoryLabelTh: cat?.labelTh ?? null,
        categoryLabelEn: cat?.labelEn ?? null,
        categorySlug: cat?.slug ?? null,
      };
    }),
  );

  return NextResponse.json({
    articles: items,
    categories: cats,
    page,
    pageSize,
  });
}
