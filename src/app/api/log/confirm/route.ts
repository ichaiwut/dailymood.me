import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, moodTypes } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { todayKey } from "@/lib/usage";
import { and, eq, isNull, or } from "drizzle-orm";

export const runtime = "edge";

interface ConfirmBody {
  moodTypeId: string;
  note?: string;
  tags?: string[];
  sentiment?: number | null;
  imageKey?: string | null;
  aiSource?: "manual" | "nlp" | "vision" | "nlp+vision";
}

export async function POST(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as ConfirmBody;
  if (!body.moodTypeId) {
    return NextResponse.json({ error: "mood_required" }, { status: 400 });
  }

  const db = getDb();
  // Validate mood ownership: must be a system default OR user-owned
  const [mt] = await db
    .select({ id: moodTypes.id })
    .from(moodTypes)
    .where(
      and(
        eq(moodTypes.id, body.moodTypeId),
        or(isNull(moodTypes.userId), eq(moodTypes.userId, userId)),
      ),
    )
    .limit(1);
  if (!mt) return NextResponse.json({ error: "invalid_mood" }, { status: 400 });

  const id = ulid();
  await db.insert(moodEntries).values({
    id,
    userId,
    moodTypeId: body.moodTypeId,
    note: body.note?.trim() || null,
    tags: (body.tags ?? []).slice(0, 12),
    sentiment: body.sentiment ?? null,
    imageKey: body.imageKey ?? null,
    aiSource: body.aiSource ?? "manual",
    date: todayKey(),
  });

  return NextResponse.json({ id });
}
