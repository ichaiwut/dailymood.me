import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles, articleBookmarks } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { slug } = await params;
  const db = getDb();

  const [article] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!article) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.insert(articleBookmarks)
    .values({ userId, articleId: article.id })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { slug } = await params;
  const db = getDb();

  const [article] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!article) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.delete(articleBookmarks)
    .where(and(eq(articleBookmarks.userId, userId), eq(articleBookmarks.articleId, article.id)));

  return NextResponse.json({ ok: true });
}
