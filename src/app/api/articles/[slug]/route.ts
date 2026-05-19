import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles, articleCategories, articleBookmarks } from "@/db/schema";
import { and, eq, ne, desc, count, sql } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { slug } = await params;
  const db = getDb();

  const [row] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.published, true)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Increment view count (fire-and-forget)
  db.update(articles)
    .set({ viewCount: sql`${articles.viewCount} + 1` })
    .where(eq(articles.id, row.id))
    .then(() => {});

  const [category, coverImageUrl, bookmarkRows, saveCountRows, relatedRows] = await Promise.all([
    row.categoryId
      ? db.select().from(articleCategories).where(eq(articleCategories.id, row.categoryId)).limit(1).then((r) => r[0] ?? null)
      : Promise.resolve(null),
    row.coverImageKey ? getSignedReadUrl(row.coverImageKey) : Promise.resolve(null),
    db.select().from(articleBookmarks).where(and(eq(articleBookmarks.userId, userId), eq(articleBookmarks.articleId, row.id))).limit(1),
    db.select({ c: count() }).from(articleBookmarks).where(eq(articleBookmarks.articleId, row.id)),
    db.select({
      id: articles.id,
      slug: articles.slug,
      titleTh: articles.titleTh,
      titleEn: articles.titleEn,
      categoryId: articles.categoryId,
      readingTimeMinutes: articles.readingTimeMinutes,
      tone: articles.tone,
    })
      .from(articles)
      .where(and(eq(articles.published, true), ne(articles.id, row.id)))
      .orderBy(desc(articles.publishedAt))
      .limit(3),
  ]);

  // Hydrate related articles with category labels
  const relatedCatIds = [...new Set(relatedRows.filter((r) => r.categoryId).map((r) => r.categoryId!))];
  const relatedCats = relatedCatIds.length > 0
    ? await db.select().from(articleCategories).where(sql`${articleCategories.id} IN (${sql.join(relatedCatIds.map((id) => sql`${id}`), sql`, `)})`)
    : [];
  const catMap = new Map(relatedCats.map((c) => [c.id, c]));

  const related = relatedRows.map((r) => {
    const cat = r.categoryId ? catMap.get(r.categoryId) : null;
    return { ...r, categoryLabelTh: cat?.labelTh ?? null, categoryLabelEn: cat?.labelEn ?? null };
  });

  const { coverImageKey: _omit, ...articleData } = row;

  return NextResponse.json({
    article: { ...articleData, coverImageUrl },
    category,
    bookmarked: bookmarkRows.length > 0,
    saveCount: saveCountRows[0]?.c ?? 0,
    related,
  });
}
