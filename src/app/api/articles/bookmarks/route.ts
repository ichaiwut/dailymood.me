import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles, articleBookmarks, articleCategories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";

export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();

  const bookmarks = await db
    .select({ articleId: articleBookmarks.articleId, createdAt: articleBookmarks.createdAt })
    .from(articleBookmarks)
    .where(eq(articleBookmarks.userId, userId))
    .orderBy(desc(articleBookmarks.createdAt));

  if (bookmarks.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  const articleIds = bookmarks.map((b) => b.articleId);
  const rows = await db.select().from(articles).where(
    eq(articles.published, true),
  );

  const savedArticles = rows.filter((a) => articleIds.includes(a.id));

  const catIds = [...new Set(savedArticles.filter((a) => a.categoryId).map((a) => a.categoryId!))];
  const cats = catIds.length > 0
    ? await db.select().from(articleCategories).where(eq(articleCategories.id, catIds[0])).then(async (first) => {
        const all = [first[0]];
        for (const id of catIds.slice(1)) {
          const [c] = await db.select().from(articleCategories).where(eq(articleCategories.id, id)).limit(1);
          if (c) all.push(c);
        }
        return all;
      })
    : [];
  const catMap = new Map(cats.filter(Boolean).map((c) => [c.id, c]));

  const items = await Promise.all(
    bookmarks
      .map((b) => savedArticles.find((a) => a.id === b.articleId))
      .filter(Boolean)
      .map(async (a) => {
        const cat = a!.categoryId ? catMap.get(a!.categoryId) : null;
        return {
          slug: a!.slug,
          titleTh: a!.titleTh,
          titleEn: a!.titleEn,
          excerptTh: a!.excerptTh,
          excerptEn: a!.excerptEn,
          coverImageUrl: a!.coverImageKey ? await getSignedReadUrl(a!.coverImageKey) : null,
          categoryLabelTh: cat?.labelTh ?? null,
          categoryLabelEn: cat?.labelEn ?? null,
          readingTimeMinutes: a!.readingTimeMinutes,
          tone: a!.tone,
        };
      }),
  );

  return NextResponse.json({ articles: items });
}
