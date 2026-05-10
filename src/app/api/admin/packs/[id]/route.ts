import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { moodPacks, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";

export const runtime = "edge";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;
  const body = await req.json();
  const { label, premium } = body as { label?: string; premium?: boolean };

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (label !== undefined) updates.label = label;
  if (premium !== undefined) updates.premium = premium;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  await db.update(moodPacks).set(updates).where(eq(moodPacks.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;

  if (id === DEFAULT_MOOD_PACK) {
    return NextResponse.json({ error: "cannot_delete_default" }, { status: 400 });
  }

  const db = getDb();

  // Reset users on this pack back to default
  await db
    .update(users)
    .set({ moodPack: DEFAULT_MOOD_PACK })
    .where(eq(users.moodPack, id));

  await db.delete(moodPacks).where(eq(moodPacks.id, id));
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;
  const db = getDb();

  const [pack] = await db.select().from(moodPacks).where(eq(moodPacks.id, id)).limit(1);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [{ count: userCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.moodPack, id));

  return NextResponse.json({ pack, userCount });
}
