import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, insightsAiCache } from "@/db/schema";
import { and, desc, eq, gte, lte, inArray } from "drizzle-orm";
import { generateInsights, generateForecast, generateThemes, generateDna } from "@/lib/gemini";
import { moodScore, computeStreak, computeWellnessScore, isoWeekKey, ymd, addDays } from "@/lib/mood-scores";
import type { InsightsAiResult } from "@/db/schema";
import { getNlpUsage, FREE_NLP_DAILY_LIMIT } from "@/lib/usage";
import { getCached, setCached } from "@/lib/ai-cache";
import { createHash } from "crypto";

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";
  const weekParam = url.searchParams.get("week") ?? isoWeekKey(new Date());
  const weekKey = /^\d{4}-W\d{2}$/.test(weekParam) ? weekParam : isoWeekKey(new Date());
  const isPremium = meetsTier(tier, "premium");

  const db = getDb();

  // ── Status data ──
  const start30 = ymd(addDays(new Date(), -29));
  const allRecent = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      note: moodEntries.note,
      tags: moodEntries.tags,
      sentiment: moodEntries.sentiment,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start30)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(200);

  const entryCount = allRecent.length;
  const ready = entryCount >= 7;

  let aiQuota: { used: number; limit: number } | null = null;
  if (!isPremium) {
    const used = await getNlpUsage(userId);
    aiQuota = { used, limit: FREE_NLP_DAILY_LIMIT };
  }

  const status = { ready, entryCount, aiQuota, tier };

  if (entryCount < 7) {
    return NextResponse.json({ status, tooFewEntries: true, weekKey });
  }

  // ── Weekly data (week-scoped entries) ──
  const weekRange = weekDateRange(weekKey);
  const weekEntries = allRecent.filter((r) => r.date >= weekRange.start && r.date <= weekRange.end);

  const weekScores = weekEntries.map((r) => moodScore(r.moodTypeId));
  const avgMood = weekScores.length > 0 ? +(weekScores.reduce((s, v) => s + v, 0) / weekScores.length).toFixed(1) : 0;
  const uniqueWeekDates = new Set(weekEntries.map((r) => r.date));
  const goodDays = [...uniqueWeekDates].filter((date) => {
    const dayEntries = weekEntries.filter((r) => r.date === date);
    return dayEntries.reduce((s, r) => s + moodScore(r.moodTypeId), 0) / dayEntries.length >= 4;
  }).length;
  const streak = computeStreak(new Set(allRecent.map((r) => r.date)));
  const wellnessScore = computeWellnessScore({ avgMood, daysWithEntries: uniqueWeekDates.size, totalDays: 7, goodDays, streak });

  // Prev week delta
  const prevStart = ymd(addDays(new Date(weekRange.start), -7));
  const prevEnd = ymd(addDays(new Date(weekRange.start), -1));
  const prevEntries = allRecent.filter((r) => r.date >= prevStart && r.date <= prevEnd);
  const prevAvg = prevEntries.length > 0 ? prevEntries.reduce((s, r) => s + moodScore(r.moodTypeId), 0) / prevEntries.length : avgMood;
  const avgMoodDelta = +(avgMood - prevAvg).toFixed(1);

  const stats = { avgMood, avgMoodDelta, goodDays, patternsCount: 0, wellnessScore, wellnessDelta: 0 };

  // ── Check insights cache ──
  const cachedRows = await db
    .select().from(insightsAiCache)
    .where(and(eq(insightsAiCache.userId, userId), eq(insightsAiCache.weekKey, weekKey)))
    .limit(1);
  const cached = cachedRows[0];

  let weeklyResult: InsightsAiResult | null = null;
  const cacheValid = cached && Math.abs(entryCount - cached.entryCount) < 3;

  if (cacheValid) {
    // Cache is fresh — use it
    weeklyResult = cached.result;
  } else if (cached) {
    // Cache exists but stale — return stale data immediately, regenerate in background
    weeklyResult = cached.result;
    if (weekEntries.length >= 3) {
      regenerateInsights(db, userId, weekKey, allRecent, locale, entryCount);
    }
  } else if (weekEntries.length >= 3) {
    // No cache at all (first visit) — must wait for Gemini
    weeklyResult = await generateAndCacheInsights(db, userId, weekKey, allRecent, locale, entryCount);
  }

  stats.patternsCount = weeklyResult?.patterns?.length ?? 0;

  // ── Premium features (DB-cached, Gemini only on miss) ──
  let forecast = null, energy = null, themes = null, dna = null;

  if (isPremium) {
    energy = getEnergyClock(allRecent);

    // Check DB cache for premium features (single query, with entryCount for delta check)
    const cacheKeys = [`forecast-${weekKey}`, `themes-${weekKey}`, `dna-${weekKey}`];
    let dbCacheRows: { weekKey: string; result: unknown; entryCount: number }[] = [];
    try {
      dbCacheRows = await db
        .select({ weekKey: insightsAiCache.weekKey, result: insightsAiCache.result, entryCount: insightsAiCache.entryCount })
        .from(insightsAiCache)
        .where(and(
          eq(insightsAiCache.userId, userId),
          inArray(insightsAiCache.weekKey, cacheKeys),
        ));
    } catch { /* table may not exist */ }

    const cacheMap = new Map(dbCacheRows.map((r) => [r.weekKey, r]));

    const isCacheValid = (key: string) => {
      const row = cacheMap.get(key);
      return row && Math.abs(entryCount - row.entryCount) < 3;
    };

    forecast = isCacheValid(`forecast-${weekKey}`) ? cacheMap.get(`forecast-${weekKey}`)!.result : null;
    themes = isCacheValid(`themes-${weekKey}`) ? cacheMap.get(`themes-${weekKey}`)!.result : null;
    dna = isCacheValid(`dna-${weekKey}`) ? cacheMap.get(`dna-${weekKey}`)!.result : null;

    // Fire-and-forget: generate stale/missing features async + save to DB
    const savePremiumCache = async (key: string, generator: () => Promise<unknown>) => {
      try {
        const result = await generator();
        if (!result) return;
        await db.insert(insightsAiCache)
          .values({ userId, weekKey: key, result: result as InsightsAiResult, entryCount, generatedAt: new Date() })
          .onConflictDoUpdate({ target: [insightsAiCache.userId, insightsAiCache.weekKey], set: { result: result as InsightsAiResult, entryCount, generatedAt: new Date() } });
      } catch { /* ignore */ }
    };

    if (!forecast && allRecent.length >= 7) {
      savePremiumCache(`forecast-${weekKey}`, () => getForecast(userId, allRecent, locale));
    }
    if (!themes && allRecent.length >= 7) {
      savePremiumCache(`themes-${weekKey}`, () => getThemes(userId, allRecent, locale));
    }
    if (!dna && allRecent.length >= 7) {
      savePremiumCache(`dna-${weekKey}`, () => getDna(userId, allRecent, locale));
    }
  }

  // ── Build response ──
  const response: Record<string, unknown> = { status, weekKey, stats, streak };

  if (weeklyResult) {
    if (!isPremium) {
      response.headline = weeklyResult.previewHeadline || weeklyResult.headline;
      response.summary = firstSentence(weeklyResult.summary);
      response.locked = true;
    } else {
      response.headline = weeklyResult.headline;
      response.summary = weeklyResult.summary;
      response.patterns = weeklyResult.patterns;
      response.suggestion = weeklyResult.suggestion;
    }
  }

  if (forecast) response.forecast = forecast;
  if (energy) response.energy = energy;
  if (themes) response.themes = themes;
  if (dna) response.dna = dna;

  return NextResponse.json(response);
}

// ── Helpers ──

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : text.slice(0, 80);
}

function weekDateRange(weekKey: string) {
  const m = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!m) { const n = new Date(); const mon = new Date(n); mon.setDate(n.getDate() - ((n.getDay() + 6) % 7)); return { start: ymd(mon), end: ymd(addDays(mon, 6)) }; }
  const year = parseInt(m[1], 10), week = parseInt(m[2], 10);
  const jan4 = new Date(year, 0, 4);
  const dow = (jan4.getDay() + 6) % 7;
  const mon = new Date(jan4); mon.setDate(jan4.getDate() - dow + (week - 1) * 7);
  return { start: ymd(mon), end: ymd(addDays(mon, 6)) };
}

type EntryRow = { date: string; moodTypeId: string; note: string | null; tags: unknown; sentiment: number | null; createdAt: Date };
type DbType = ReturnType<typeof getDb>;

function buildInsightsPayload(allRecent: EntryRow[], locale: string, entryCount: number) {
  const moodCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const dayCounts: Record<string, number> = {};
  let sentSum = 0, sentN = 0;
  for (const r of allRecent) {
    moodCounts[r.moodTypeId] = (moodCounts[r.moodTypeId] ?? 0) + 1;
    for (const t of (r.tags as string[] | null) ?? []) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    const dow = r.createdAt.toLocaleDateString("en-US", { weekday: "short" });
    dayCounts[dow] = (dayCounts[dow] ?? 0) + 1;
    if (r.sentiment != null) { sentSum += r.sentiment; sentN++; }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, c]) => `${t}:${c}`);
  const recent = allRecent.slice(0, 10).map((r) => ({ d: r.date, m: r.moodTypeId, n: r.note?.slice(0, 60) ?? null }));
  return JSON.stringify({ locale, n: entryCount, avgSent: sentN ? +(sentSum / sentN).toFixed(2) : null, moods: moodCounts, days: dayCounts, tags: topTags, recent });
}

function parseInsightsResult(raw: Awaited<ReturnType<typeof generateInsights>>): InsightsAiResult {
  return {
    headline: raw.headline, previewHeadline: raw.previewHeadline, summary: raw.summary,
    patterns: raw.patterns.map((p) => ({ title: p.title, description: p.description, tag: p.tag as "pattern" | "correlation" | "alert", miniVizData: p.miniVizData })),
    suggestion: raw.suggestion,
  };
}

async function generateAndCacheInsights(db: DbType, userId: string, weekKey: string, allRecent: EntryRow[], locale: string, entryCount: number): Promise<InsightsAiResult> {
  const payload = buildInsightsPayload(allRecent, locale, entryCount);
  const raw = await generateInsights(payload);
  const result = parseInsightsResult(raw);
  await db.insert(insightsAiCache).values({ userId, weekKey, result, entryCount, generatedAt: new Date() })
    .onConflictDoUpdate({ target: [insightsAiCache.userId, insightsAiCache.weekKey], set: { result, entryCount, generatedAt: new Date() } });
  return result;
}

function regenerateInsights(db: DbType, userId: string, weekKey: string, allRecent: EntryRow[], locale: string, entryCount: number) {
  generateAndCacheInsights(db, userId, weekKey, allRecent, locale, entryCount).catch(() => {});
}

async function getForecast(userId: string, rows: EntryRow[], locale: string) {
  if (rows.length < 7) return null;
  const cacheKey = `forecast:${userId}`;
  const c = getCached(cacheKey);
  if (c) return c;

  const dayScores: Record<string, number[]> = {};
  for (const r of rows) {
    const dow = new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
    if (!dayScores[dow]) dayScores[dow] = [];
    dayScores[dow].push(moodScore(r.moodTypeId));
  }
  const dowAvgs: Record<string, number> = {};
  for (const [dow, scores] of Object.entries(dayScores)) dowAvgs[dow] = +(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);

  const last7 = [...new Set(rows.map((r) => r.date))].sort().slice(-7).map((date) => {
    const de = rows.filter((r) => r.date === date);
    return +(de.reduce((s, r) => s + moodScore(r.moodTypeId), 0) / de.length).toFixed(1);
  });

  const payload = JSON.stringify({ locale, tomorrowDow: addDays(new Date(), 1).toLocaleDateString("en-US", { weekday: "long" }), n: rows.length, dowAvgs, last7, recentMoods: rows.slice(0, 7).map((r) => ({ d: r.date, m: r.moodTypeId })) });
  try {
    const result = await generateForecast(payload);
    setCached(cacheKey, result);
    return result;
  } catch { return null; }
}

function getEnergyClock(rows: EntryRow[]) {
  if (rows.length < 7) return null;
  const hourBuckets = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));
  for (const r of rows) { const h = r.createdAt.getHours(); hourBuckets[h].sum += moodScore(r.moodTypeId); hourBuckets[h].count++; }
  const raw = hourBuckets.map((b) => b.count > 0 ? b.sum / b.count : 0);
  const hourly = raw.map((_, i) => {
    const vals = [raw[(i + 23) % 24], raw[i], raw[(i + 1) % 24]].filter((v) => v > 0);
    return vals.length > 0 ? +(vals.reduce((s, v) => s + v, 0) / vals.length / 5).toFixed(2) : 0;
  });
  let peakHour = 0, troughHour = 0, maxV = -1, minV = 2;
  for (let i = 0; i < 24; i++) { if (hourly[i] > 0 && hourly[i] > maxV) { maxV = hourly[i]; peakHour = i; } if (hourly[i] > 0 && hourly[i] < minV) { minV = hourly[i]; troughHour = i; } }
  return { hourly, peakHour, troughHour };
}

async function getThemes(userId: string, rows: EntryRow[], locale: string) {
  if (rows.length < 7) return null;
  const cacheKey = `themes:${userId}:${locale}`;
  const c = getCached(cacheKey);
  if (c) return c;

  const snippets = rows.filter((r) => r.note && r.note.length > 5).map((r) => ({ d: r.date, n: r.note!.slice(0, 80), tags: r.tags })).slice(0, 30);
  const tagCounts: Record<string, number> = {};
  for (const r of rows) for (const t of (r.tags as string[] | null) ?? []) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, c]) => `${t}:${c}`);

  try {
    const result = await generateThemes(JSON.stringify({ locale, n: rows.length, snippets, topTags }));
    setCached(cacheKey, result);
    return result;
  } catch { return null; }
}

async function getDna(userId: string, rows: EntryRow[], locale: string) {
  if (rows.length < 7) return null;
  const cacheKey = `dna:${userId}:${locale}`;
  const c = getCached(cacheKey);
  if (c) return c;

  const scores = rows.map((r) => moodScore(r.moodTypeId));
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const highMoodPct = scores.filter((s) => s >= 4).length / scores.length;
  const sentiments = rows.map((r) => r.sentiment).filter((s): s is number => s != null);
  const avgSentiment = sentiments.length > 0 ? sentiments.reduce((s, v) => s + v, 0) / sentiments.length : 0;
  const variance = scores.length > 1 ? scores.reduce((s, v) => s + (v - avgScore) ** 2, 0) / scores.length : 1;
  const allTags = rows.flatMap((r) => (r.tags as string[] | null) ?? []);
  const activityTags = allTags.filter((t) => ["ออกกำลังกาย", "เดิน", "วิ่ง", "gym", "exercise", "walk", "run", "yoga"].some((k) => t.toLowerCase().includes(k)));
  const socialTags = allTags.filter((t) => ["เพื่อน", "ครอบครัว", "แฟน", "friend", "family", "partner", "social"].some((k) => t.toLowerCase().includes(k)));
  const avgNoteLength = rows.reduce((s, r) => s + (r.note ?? "").length, 0) / rows.length;

  const axes = {
    bright: Math.min(40, Math.round(highMoodPct * 40)),
    calm: Math.min(40, Math.round(((1 - Math.min(variance, 2) / 2) * 0.5 + (avgSentiment + 1) / 2 * 0.5) * 40)),
    energy: Math.min(40, Math.round((activityTags.length / Math.max(rows.length, 1)) * 120 + 8)),
    social: Math.min(40, Math.round((socialTags.length / Math.max(rows.length, 1)) * 120 + 5)),
    depth: Math.min(40, Math.round(Math.min(avgNoteLength / 60, 1) * 35 + 5)),
  };

  try {
    const result = await generateDna(JSON.stringify({ locale, axes, avgScore: +avgScore.toFixed(1), n: rows.length }));
    const response = { ...result, axes };
    setCached(cacheKey, response);
    return response;
  } catch { return null; }
}
