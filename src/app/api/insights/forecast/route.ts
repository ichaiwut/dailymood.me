import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, forecastCache } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { generateForecast } from "@/lib/gemini";
import { moodScore, ymd, addDays } from "@/lib/mood-scores";
import type { ForecastResult } from "@/db/schema";
import { createHash } from "crypto";

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";

  const db = getDb();
  const start = ymd(addDays(new Date(), -29));

  const rows = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      tags: moodEntries.tags,
      sentiment: moodEntries.sentiment,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(100);

  if (rows.length < 7) {
    return NextResponse.json({ tooFewEntries: true, entriesNeeded: 7 - rows.length });
  }

  const tomorrow = ymd(addDays(new Date(), 1));
  const inputHash = createHash("md5").update(rows.map((r) => `${r.date}:${r.moodTypeId}`).join(",")).digest("hex").slice(0, 12);

  // Try cache (skip if table doesn't exist yet)
  try {
    const cachedRows = await db
      .select()
      .from(forecastCache)
      .where(and(eq(forecastCache.userId, userId), eq(forecastCache.targetDate, tomorrow)))
      .limit(1);

    if (cachedRows[0] && cachedRows[0].inputHash === inputHash) {
      return NextResponse.json(cachedRows[0].result);
    }
  } catch {
    // Table may not exist yet — continue without cache
  }

  // Build forecast payload
  const dayScores: Record<string, number[]> = {};
  const tagCounts: Record<string, number> = {};

  for (const r of rows) {
    const score = moodScore(r.moodTypeId);
    const dow = new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
    if (!dayScores[dow]) dayScores[dow] = [];
    dayScores[dow].push(score);

    for (const t of (r.tags as string[] | null) ?? []) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }

  const uniqueDates = [...new Set(rows.map((r) => r.date))].sort().slice(-7);
  const last7: number[] = [];
  for (const date of uniqueDates) {
    const dayEntries = rows.filter((r) => r.date === date);
    const avg = dayEntries.reduce((s, r) => s + moodScore(r.moodTypeId), 0) / dayEntries.length;
    last7.push(+avg.toFixed(1));
  }

  const dowAvgs: Record<string, number> = {};
  for (const [dow, scores] of Object.entries(dayScores)) {
    dowAvgs[dow] = +(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
  }

  const tomorrowDow = addDays(new Date(), 1).toLocaleDateString("en-US", { weekday: "long" });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, c]) => `${t}:${c}`);

  const payload = JSON.stringify({
    locale,
    tomorrowDow,
    n: rows.length,
    dowAvgs,
    last7,
    topTags,
    recentMoods: rows.slice(0, 7).map((r) => ({ d: r.date, m: r.moodTypeId })),
  });

  const result: ForecastResult = await generateForecast(payload);

  // Try cache write (skip if table doesn't exist yet)
  try {
    await db
      .insert(forecastCache)
      .values({ userId, targetDate: tomorrow, result, inputHash, generatedAt: new Date() })
      .onConflictDoUpdate({
        target: [forecastCache.userId, forecastCache.targetDate],
        set: { result, inputHash, generatedAt: new Date() },
      });
  } catch {
    // Table may not exist yet — result still returned
  }

  return NextResponse.json(result);
}
