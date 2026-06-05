import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles, articleReactions, articleCategories } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";

export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();

  // The user's reactions, most recently reacted first.
  const reactions = await db
    .select({ articleId: articleReactions.articleId, moodTypeId: articleReactions.moodTypeId, updatedAt: articleReactions.updatedAt })
    .from(articleReactions)
    .where(eq(articleReactions.userId, userId))
    .orderBy(desc(articleReactions.updatedAt));

  if (reactions.length === 0) return NextResponse.json({ articles: [] });

  const articleIds = reactions.map((r) => r.articleId);
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.published, true), inArray(articles.id, articleIds)));
  const byId = new Map(rows.map((a) => [a.id, a]));

  const catIds = [...new Set(rows.filter((a) => a.categoryId).map((a) => a.categoryId!))];
  const cats = catIds.length > 0
    ? await db.select().from(articleCategories).where(inArray(articleCategories.id, catIds))
    : [];
  const catMap = new Map(cats.map((c) => [c.id, c]));

  // Preserve reaction order; drop reactions whose article is unpublished/deleted.
  const items = await Promise.all(
    reactions
      .map((r) => ({ r, a: byId.get(r.articleId) }))
      .filter((x): x is { r: typeof reactions[number]; a: typeof rows[number] } => !!x.a)
      .map(async ({ r, a }) => {
        const cat = a.categoryId ? catMap.get(a.categoryId) : null;
        return {
          slug: a.slug,
          titleTh: a.titleTh,
          titleEn: a.titleEn,
          excerptTh: a.excerptTh,
          excerptEn: a.excerptEn,
          coverImageUrl: a.coverImageKey ? await getSignedReadUrl(a.coverImageKey) : null,
          categoryLabelTh: cat?.labelTh ?? null,
          categoryLabelEn: cat?.labelEn ?? null,
          readingTimeMinutes: a.readingTimeMinutes,
          tone: a.tone,
          moodTypeId: r.moodTypeId,
        };
      }),
  );

  return NextResponse.json({ articles: items });
}
