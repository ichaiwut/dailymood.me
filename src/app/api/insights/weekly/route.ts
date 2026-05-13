import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, insightsAiCache } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { generateInsights } from "@/lib/gemini";
import { moodScore, computeStreak, computeWellnessScore, isoWeekKey, ymd, addDays } from "@/lib/mood-scores";
import type { InsightsAiResult } from "@/db/schema";

function weekDateRange(weekKey: string): { start: string; end: string } {
  const m = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!m) {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sun = addDays(mon, 6);
    return { start: ymd(mon), end: ymd(sun) };
  }
  const year = parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7);
  const sun = addDays(mon, 6);
  return { start: ymd(mon), end: ymd(sun) };
}

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";
  const weekParam = url.searchParams.get("week") ?? isoWeekKey(new Date());
  const weekKey = /^\d{4}-W\d{2}$/.test(weekParam) ? weekParam : isoWeekKey(new Date());

  const db = getDb();
  const { start, end } = weekDateRange(weekKey);

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
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start), lte(moodEntries.date, end)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(100);

  if (rows.length === 0) {
    return NextResponse.json({ empty: true, weekKey });
  }

  // Compute stat tiles
  const scores = rows.map((r) => moodScore(r.moodTypeId));
  const avgMood = scores.reduce((s, v) => s + v, 0) / scores.length;

  const uniqueDates = new Set(rows.map((r) => r.date));
  const daysWithEntries = uniqueDates.size;
  const goodDays = [...uniqueDates].filter((date) => {
    const dayEntries = rows.filter((r) => r.date === date);
    const dayAvg = dayEntries.reduce((s, r) => s + moodScore(r.moodTypeId), 0) / dayEntries.length;
    return dayAvg >= 4;
  }).length;

  const streak = computeStreak(uniqueDates);

  const wellnessScore = computeWellnessScore({
    avgMood,
    daysWithEntries,
    totalDays: 7,
    goodDays,
    streak,
  });

  // Check insights cache
  const cachedRows = await db
    .select()
    .from(insightsAiCache)
    .where(and(eq(insightsAiCache.userId, userId), eq(insightsAiCache.weekKey, weekKey)))
    .limit(1);
  const cached = cachedRows[0];

  const stats = {
    avgMood: +avgMood.toFixed(1),
    avgMoodDelta: 0,
    goodDays,
    patternsCount: cached?.result?.patterns?.length ?? 0,
    wellnessScore,
    wellnessDelta: 0,
  };

  // Compute delta from previous week
  const prevWeekStart = ymd(addDays(new Date(start), -7));
  const prevWeekEnd = ymd(addDays(new Date(start), -1));
  const prevRows = await db
    .select({ moodTypeId: moodEntries.moodTypeId })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, prevWeekStart), lte(moodEntries.date, prevWeekEnd)))
    .limit(100);

  if (prevRows.length > 0) {
    const prevAvg = prevRows.reduce((s, r) => s + moodScore(r.moodTypeId), 0) / prevRows.length;
    stats.avgMoodDelta = +(avgMood - prevAvg).toFixed(1);
  }

  if (cached && Math.abs(rows.length - cached.entryCount) < 3) {
    const result = cached.result;
    stats.patternsCount = result.patterns?.length ?? 0;

    if (!meetsTier(tier, "premium")) {
      return NextResponse.json({
        headline: result.previewHeadline || result.headline,
        summary: firstSentence(result.summary),
        locked: true,
        tier,
        weekKey,
        stats,
        streak,
      });
    }
    return NextResponse.json({ ...result, cached: true, tier, weekKey, stats, streak });
  }

  if (rows.length < 3) {
    return NextResponse.json({ tooFewEntries: true, weekKey, stats, streak });
  }

  // Generate fresh insights
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

  await db
    .insert(insightsAiCache)
    .values({ userId, weekKey, result, entryCount: rows.length, generatedAt: new Date() })
    .onConflictDoUpdate({
      target: [insightsAiCache.userId, insightsAiCache.weekKey],
      set: { result, entryCount: rows.length, generatedAt: new Date() },
    });

  stats.patternsCount = result.patterns?.length ?? 0;

  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({
      headline: result.previewHeadline || result.headline,
      summary: firstSentence(result.summary),
      locked: true,
      tier,
      weekKey,
      stats,
      streak,
    });
  }

  return NextResponse.json({ ...result, tier, weekKey, stats, streak });
}

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : text.slice(0, 80);
}
