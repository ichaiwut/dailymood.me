import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles, articleReactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_MOOD_IDS } from "@/lib/default-moods";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { slug } = await params;
  const body = (await req.json().catch(() => null)) as { moodTypeId?: unknown } | null;
  const moodTypeId = typeof body?.moodTypeId === "string" ? body.moodTypeId : null;
  if (!moodTypeId || !(DEFAULT_MOOD_IDS as readonly string[]).includes(moodTypeId)) {
    return NextResponse.json({ error: "invalid_mood" }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db
    .insert(articleReactions)
    .values({ userId, articleId: row.id, moodTypeId })
    .onConflictDoUpdate({
      target: [articleReactions.userId, articleReactions.articleId],
      set: { moodTypeId, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
