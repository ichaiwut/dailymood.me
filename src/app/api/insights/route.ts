import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, insightsAiCache } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { generateInsights } from "@/lib/gemini";
import { isoWeekKey, ymd, addDays, computeStreak as computeStreakFromDates } from "@/lib/mood-scores";
import type { InsightsAiResult } from "@/db/schema";


export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";
  const cacheOnly = url.searchParams.get("cacheOnly") === "1";

  const db = getDb();
  const start = ymd(addDays(new Date(), -29));

  const rows = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      note: moodEntries.note,
      tags: moodEntries.tags,
      sentiment: moodEntries.sentiment,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(100);

  if (rows.length === 0) {
    return NextResponse.json({ empty: true });
  }

  if (rows.length < 7) {
    return NextResponse.json({ tooFewEntries: true, entryCount: rows.length });
  }

  const weekKey = isoWeekKey(new Date());

  // check cache
  const cachedRows = await db
    .select()
    .from(insightsAiCache)
    .where(and(eq(insightsAiCache.userId, userId), eq(insightsAiCache.weekKey, weekKey)))
    .limit(1);
  const cached = cachedRows[0];

  if (cached && Math.abs(rows.length - cached.entryCount) < 3) {
    const result = cached.result;
    if (!meetsTier(tier, "premium")) {
      return NextResponse.json({
        headline: result.previewHeadline || result.headline,
        summary: firstSentence(result.summary),
        locked: true,
        tier,
        weekKey,
        streak: computeStreak(rows),
      });
    }
    return NextResponse.json({ ...result, cached: true, tier, weekKey, streak: computeStreak(rows) });
  }

  if (cacheOnly) {
    return NextResponse.json({ empty: true, noCache: true });
  }

  // generate fresh insights
  const moodCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const dayCounts: Record<string, number> = {};
  let sentSum = 0;
  let sentN = 0;
  for (const r of rows) {
    moodCounts[r.moodTypeId] = (moodCounts[r.moodTypeId] ?? 0) + 1;
    for (const t of (r.tags as string[] | null) ?? []) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
    const dow = r.createdAt.toLocaleDateString("en-US", { weekday: "short" });
    dayCounts[dow] = (dayCounts[dow] ?? 0) + 1;
    if (r.sentiment != null) { sentSum += r.sentiment; sentN++; }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t, c]) => `${t}:${c}`);

  const recent = rows.slice(0, 10).map((r) => ({
    d: r.date,
    m: r.moodTypeId,
    n: r.note?.slice(0, 60) ?? null,
  }));

  const payload = JSON.stringify({
    locale,
    n: rows.length,
    avgSent: sentN ? +(sentSum / sentN).toFixed(2) : null,
    moods: moodCounts,
    days: dayCounts,
    tags: topTags,
    recent,
  });

  const raw = await generateInsights(payload);
  const result: InsightsAiResult = {
    headline: raw.headline,
    previewHeadline: raw.previewHeadline,
    summary: raw.summary,
    patterns: raw.patterns.map((p) => ({
      title: p.title,
      description: p.description,
      tag: p.tag as "pattern" | "correlation" | "alert",
      miniVizData: p.miniVizData,
    })),
    suggestion: raw.suggestion,
  };

  // cache result
  await db
    .insert(insightsAiCache)
    .values({
      userId,
      weekKey,
      result,
      entryCount: rows.length,
      generatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [insightsAiCache.userId, insightsAiCache.weekKey],
      set: {
        result,
        entryCount: rows.length,
        generatedAt: new Date(),
      },
    });

  const streak = computeStreak(rows);

  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({
      headline: result.previewHeadline || result.headline,
      summary: firstSentence(result.summary),
      locked: true,
      tier,
      weekKey,
      streak,
    });
  }

  return NextResponse.json({ ...result, tier, weekKey, streak });
}

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : text.slice(0, 80);
}

function computeStreak(rows: { date: string }[]): number {
  return computeStreakFromDates(new Set(rows.map((r) => r.date)));
}
