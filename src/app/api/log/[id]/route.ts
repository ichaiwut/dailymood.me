import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, moodTypes } from "@/db/schema";
import { getSignedReadUrl, deleteObject } from "@/lib/r2";
import { and, eq, isNull, or } from "drizzle-orm";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select()
    .from(moodEntries)
    .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const imageUrl = row.imageKey ? await getSignedReadUrl(row.imageKey) : null;

  return NextResponse.json({ ...row, imageUrl, isPremium: tier === "premium" });
}

interface PatchBody {
  moodTypeId?: string;
  note?: string | null;
  tags?: string[];
  sentiment?: number | null;
  imageKey?: string | null;
  aiSummary?: string | null;
  aiSource?: "manual" | "nlp" | "vision" | "nlp+vision";
  date?: string;
  createdAt?: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select({ imageKey: moodEntries.imageKey })
    .from(moodEntries)
    .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json()) as PatchBody;

  if ("imageKey" in body && body.imageKey && !body.imageKey.startsWith(`users/${userId}/`)) {
    return NextResponse.json({ error: "invalid_image_key" }, { status: 400 });
  }

  if (body.moodTypeId) {
    const [mt] = await db
      .select({ id: moodTypes.id })
      .from(moodTypes)
      .where(and(eq(moodTypes.id, body.moodTypeId), or(isNull(moodTypes.userId), eq(moodTypes.userId, userId))))
      .limit(1);
    if (!mt) return NextResponse.json({ error: "invalid_mood" }, { status: 400 });
  }

  if ("imageKey" in body && body.imageKey !== row.imageKey && row.imageKey && row.imageKey.startsWith(`users/${userId}/`)) {
    await deleteObject(row.imageKey);
  }

  const updateData: Record<string, unknown> = {};
  if (body.moodTypeId !== undefined) updateData.moodTypeId = body.moodTypeId;
  if (body.note !== undefined) updateData.note = body.note?.trim() || null;
  if (body.tags !== undefined) updateData.tags = (body.tags ?? []).slice(0, 12);
  if (body.sentiment !== undefined) updateData.sentiment = body.sentiment;
  if ("imageKey" in body) updateData.imageKey = body.imageKey ?? null;
  if (body.aiSummary !== undefined) updateData.aiSummary = body.aiSummary;
  if (body.aiSource !== undefined) updateData.aiSource = body.aiSource;
  if (body.date !== undefined) updateData.date = body.date;
  if (body.createdAt !== undefined) {
    const d = new Date(body.createdAt);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    updateData.createdAt = d;
  }

  await db.update(moodEntries).set(updateData).where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select({ imageKey: moodEntries.imageKey })
    .from(moodEntries)
    .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (row.imageKey && row.imageKey.startsWith(`users/${userId}/`)) {
    await deleteObject(row.imageKey);
  }

  await db.delete(moodEntries).where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)));
  return NextResponse.json({ ok: true });
}
