import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { articles, articleReactions } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { ulid } from "@/lib/ulid";
import { calcReadingTime } from "@/lib/articles";

export async function GET() {
  await requireAdminAction();
  const db = getDb();
  const [rows, reactionRows] = await Promise.all([
    db.select().from(articles).orderBy(desc(articles.createdAt)),
    db
      .select({ articleId: articleReactions.articleId, count: sql<number>`count(*)` })
      .from(articleReactions)
      .groupBy(articleReactions.articleId),
  ]);
  const reactionMap = new Map(reactionRows.map((r) => [r.articleId, Number(r.count)]));
  const result = rows.map((a) => ({ ...a, reactionCount: reactionMap.get(a.id) ?? 0 }));
  return NextResponse.json({ articles: result });
}

export async function POST(req: NextRequest) {
  await requireAdminAction();
  const body = await req.json();
  const {
    slug, titleTh, titleEn, excerptTh, excerptEn,
    bodyTh, bodyEn, categoryId, published, tone, tags,
  } = body as {
    slug: string;
    titleTh: string;
    titleEn: string;
    excerptTh: string;
    excerptEn: string;
    bodyTh?: string;
    bodyEn?: string;
    categoryId?: string;
    published?: boolean;
    tone?: string;
    tags?: string[];
  };

  if (!slug || !titleTh || !titleEn || !excerptTh || !excerptEn) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const id = ulid();
  const bTh = bodyTh ?? "";
  const bEn = bodyEn ?? "";
  const isPublished = !!published;

  const db = getDb();
  try {
    await db.insert(articles).values({
      id,
      slug,
      titleTh,
      titleEn,
      excerptTh,
      excerptEn,
      bodyTh: bTh,
      bodyEn: bEn,
      categoryId: categoryId || null,
      tone: tone || "peach",
      tags: tags ?? [],
      readingTimeMinutes: calcReadingTime(bTh, bEn),
      published: isPublished,
      publishedAt: isPublished ? new Date() : null,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("unique")) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ id });
}
