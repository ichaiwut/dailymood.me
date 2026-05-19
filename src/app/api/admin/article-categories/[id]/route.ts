import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { articleCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;
  const body = await req.json() as { labelTh?: string; labelEn?: string; order?: number };

  const update: Record<string, unknown> = {};
  if (body.labelTh !== undefined) update.labelTh = body.labelTh;
  if (body.labelEn !== undefined) update.labelEn = body.labelEn;
  if (body.order !== undefined) update.order = body.order;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const db = getDb();
  await db.update(articleCategories).set(update).where(eq(articleCategories.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;
  const db = getDb();
  await db.delete(articleCategories).where(eq(articleCategories.id, id));
  return NextResponse.json({ ok: true });
}
