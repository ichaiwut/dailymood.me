import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, moodTypes, flashbackCache } from "@/db/schema";
import { getSignedReadUrl, deleteObject } from "@/lib/r2";
import { todayKey } from "@/lib/usage";
import { and, desc, eq, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import { moodScore } from "@/lib/mood-scores";
import { generateFlashback } from "@/lib/gemini";
import type { FlashbackResult } from "@/lib/gemini";


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

  const [countRow] = await db
    .select({ n: sql<number>`count(*)` })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), lte(moodEntries.createdAt, row.createdAt)));
  const entryNumber = countRow?.n ?? 0;

  // Nearby days (prev day, current day, next day)
  const entryDate = new Date(row.date + "T12:00:00");
  const prevDate = new Date(entryDate); prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(entryDate); nextDate.setDate(nextDate.getDate() + 1);
  const nearbyDates = [prevDate, entryDate, nextDate].map((d) => d.toISOString().slice(0, 10));

  const nearbyRows = await db
    .select({ date: moodEntries.date, moodTypeId: moodEntries.moodTypeId, note: moodEntries.note })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), inArray(moodEntries.date, nearbyDates)));

  const nearbyMap = new Map(nearbyRows.map((r) => [r.date, r]));
  const nearby = nearbyDates.map((d) => nearbyMap.get(d) ?? { date: d, moodTypeId: null, note: null });

  // Same date last month
  const entryD = new Date(row.date + "T12:00:00");
  entryD.setMonth(entryD.getMonth() - 1);
  const lastYearDate = entryD.toISOString().slice(0, 10);
  const [lastYearRow] = await db
    .select({ date: moodEntries.date, moodTypeId: moodEntries.moodTypeId, note: moodEntries.note })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), eq(moodEntries.date, lastYearDate)))
    .limit(1);

  // Current streak
  const allDates = await db
    .select({ date: moodEntries.date })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), lte(moodEntries.date, row.date)))
    .orderBy(desc(moodEntries.date))
    .limit(400);
  const dateSet = new Set(allDates.map((r) => r.date));
  let streak = 0;
  const cur = new Date(row.date + "T12:00:00");
  while (dateSet.has(cur.toISOString().slice(0, 10))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  let flashback: FlashbackResult | null = null;
  const score = moodScore(row.moodTypeId);
  if (tier === "premium" && score <= 2) {
    try {
      const [cached] = await db
        .select({ result: flashbackCache.result })
        .from(flashbackCache)
        .where(eq(flashbackCache.entryId, id))
        .limit(1);
      if (cached) {
        flashback = cached.result as FlashbackResult;
      }
    } catch {
      // table may not exist yet
    }

    if (!flashback) {
      try {
        const url = new URL(_req.url);
        const locale = url.searchParams.get("locale") ?? "th";

        const negativeMoods = ["sad", "angry", "anxious", "tired"];
        const pastEntries = await db
          .select({ date: moodEntries.date, moodTypeId: moodEntries.moodTypeId, note: moodEntries.note, tags: moodEntries.tags })
          .from(moodEntries)
          .where(and(
            eq(moodEntries.userId, userId),
            ne(moodEntries.id, id),
            inArray(moodEntries.moodTypeId, negativeMoods),
          ))
          .orderBy(desc(moodEntries.createdAt))
          .limit(10);

        if (pastEntries.length > 0) {
          const payload = JSON.stringify({
            locale,
            currentEntry: { date: row.date, mood: row.moodTypeId, note: (row.note ?? "").slice(0, 200), tags: (row.tags as string[] | null) ?? [] },
            pastEntries: pastEntries.map((e) => ({
              date: e.date,
              mood: e.moodTypeId,
              note: (e.note ?? "").slice(0, 100),
              tags: (e.tags as string[] | null) ?? [],
            })),
          });
          flashback = await generateFlashback(payload);

          try {
            await db.insert(flashbackCache).values({ entryId: id, result: flashback, generatedAt: new Date() });
          } catch {
            // table may not exist yet
          }
        }
      } catch {
        // Gemini failed — no flashback
      }
    }
  }

  return NextResponse.json({
    ...row, imageUrl, isPremium: tier === "premium", entryNumber,
    nearby,
    lastYear: lastYearRow ?? null,
    streak,
    flashback,
  });
}

interface PatchBody {
  moodTypeId?: string;
  note?: string | null;
  tags?: string[];
  sentiment?: number | null;
  imageKey?: string | null;
  aiSummary?: string | null;
  aiSource?: "manual" | "nlp" | "vision" | "nlp+vision";
  activityId?: string | null;
  location?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
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
  if (body.note !== undefined) updateData.note = body.note?.trim()?.slice(0, 2000) || null;
  if (body.tags !== undefined) updateData.tags = (body.tags ?? []).slice(0, 12);
  if (body.sentiment !== undefined) updateData.sentiment = body.sentiment;
  if ("imageKey" in body) updateData.imageKey = body.imageKey ?? null;
  if (body.aiSummary !== undefined) updateData.aiSummary = body.aiSummary;
  if (body.aiSource !== undefined) updateData.aiSource = body.aiSource;
  if ("activityId" in body) updateData.activityId = body.activityId ?? null;
  if (body.location !== undefined) updateData.location = body.location?.trim()?.slice(0, 200) || null;
  if (body.locationLat !== undefined) updateData.locationLat = body.locationLat;
  if (body.locationLng !== undefined) updateData.locationLng = body.locationLng;
  if (body.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }
    if (body.date > todayKey()) {
      return NextResponse.json({ error: "future_date" }, { status: 400 });
    }
    updateData.date = body.date;
  }
  if (body.createdAt !== undefined) {
    const d = new Date(body.createdAt);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    if (d > new Date()) return NextResponse.json({ error: "future_date" }, { status: 400 });
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
