import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteObject } from "@/lib/r2";
import { calcReadingTime } from "@/lib/articles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;
  const db = getDb();
  const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ article: row });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;
  const body = await req.json() as {
    titleTh?: string;
    titleEn?: string;
    excerptTh?: string;
    excerptEn?: string;
    bodyTh?: string;
    bodyEn?: string;
    categoryId?: string;
    published?: boolean;
    tone?: string;
    tags?: string[];
  };

  const db = getDb();
  const [existing] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (body.titleTh !== undefined) update.titleTh = body.titleTh;
  if (body.titleEn !== undefined) update.titleEn = body.titleEn;
  if (body.excerptTh !== undefined) update.excerptTh = body.excerptTh;
  if (body.excerptEn !== undefined) update.excerptEn = body.excerptEn;
  if (body.bodyTh !== undefined) update.bodyTh = body.bodyTh;
  if (body.bodyEn !== undefined) update.bodyEn = body.bodyEn;
  if (body.categoryId !== undefined) update.categoryId = body.categoryId || null;
  if (body.tone !== undefined) update.tone = body.tone;
  if (body.tags !== undefined) update.tags = body.tags;

  if (body.bodyTh !== undefined || body.bodyEn !== undefined) {
    const bTh = (body.bodyTh ?? existing.bodyTh) as string;
    const bEn = (body.bodyEn ?? existing.bodyEn) as string;
    update.readingTimeMinutes = calcReadingTime(bTh, bEn);
  }

  if (body.published !== undefined) {
    update.published = !!body.published;
    if (body.published && !existing.publishedAt) {
      update.publishedAt = new Date();
    } else if (!body.published) {
      update.publishedAt = null;
    }
  }

  await db.update(articles).set(update).where(eq(articles.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;
  const db = getDb();
  const [row] = await db
    .select({ coverImageKey: articles.coverImageKey })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  if (row?.coverImageKey) {
    await deleteObject(row.coverImageKey);
  }

  await db.delete(articles).where(eq(articles.id, id));
  return NextResponse.json({ ok: true });
}
