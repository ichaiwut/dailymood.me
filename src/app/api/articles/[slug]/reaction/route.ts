import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles, moodEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ulid } from "@/lib/ulid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { moodTypeId } = await req.json() as { moodTypeId: string };
  if (!moodTypeId) return NextResponse.json({ error: "missing_mood" }, { status: 400 });

  const { slug } = await params;
  const db = getDb();

  const [article] = await db.select({ id: articles.id, titleTh: articles.titleTh }).from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!article) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);

  await db.insert(moodEntries).values({
    id: ulid(),
    userId,
    moodTypeId,
    date: today,
    note: null,
    tags: ["article-reaction"],
    aiSource: "article-reaction",
    aiSummary: article.titleTh,
  });

  return NextResponse.json({ ok: true });
}
