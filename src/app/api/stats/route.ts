import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { moodScore, ymd, addDays, computeStreak } from "@/lib/mood-scores";

export const runtime = "edge";

type Period = "week" | "month" | "year";

const PERIOD_DAYS: Record<Period, number> = { week: 6, month: 29, year: 364 };

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") as Period) || "week";

  if (period === "year" && tier !== "premium") {
    return NextResponse.json({ premiumRequired: true });
  }

  const db = getDb();
  const today = ymd(new Date());
  const days = PERIOD_DAYS[period] ?? 6;
  const start = ymd(addDays(new Date(), -days));
  const prevStart = ymd(addDays(new Date(), -days * 2 - 1));

  const rows = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      tags: moodEntries.tags,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, prevStart)))
    .orderBy(desc(moodEntries.createdAt));

  const currentRows = rows.filter((r) => r.date >= start);
  const prevRows = rows.filter((r) => r.date < start);

  const distribution: Record<string, number> = {};
  const perDay = new Map<string, Map<string, number>>();
  let todayMood: { moodId: string; createdAt: number } | null = null;

  for (const r of currentRows) {
    distribution[r.moodTypeId] = (distribution[r.moodTypeId] ?? 0) + 1;
    const day = perDay.get(r.date) ?? new Map<string, number>();
    day.set(r.moodTypeId, (day.get(r.moodTypeId) ?? 0) + 1);
    perDay.set(r.date, day);
    if (r.date === today && !todayMood) {
      todayMood = { moodId: r.moodTypeId, createdAt: r.createdAt.getTime() };
    }
  }

  // trend: dominant mood per day for the period
  const dailyTrend: { date: string; moodId: string | null }[] = [];
  for (let i = days; i >= 0; i--) {
    const d = ymd(addDays(new Date(), -i));
    const counts = perDay.get(d);
    dailyTrend.push({ date: d, moodId: counts ? topMood(counts) : null });
  }

  // for year view: aggregate into monthly buckets (12 points)
  let moodTrend: { date: string; moodId: string | null; avgScore?: number }[];
  if (period === "year") {
    const buckets = new Map<string, number[]>();
    for (const d of dailyTrend) {
      if (!d.moodId) continue;
      const monthKey = d.date.slice(0, 7); // "YYYY-MM"
      const arr = buckets.get(monthKey) ?? [];
      arr.push(moodScore(d.moodId));
      buckets.set(monthKey, arr);
    }
    // build 12 monthly points
    moodTrend = [];
    for (let i = 11; i >= 0; i--) {
      const m = addDays(new Date(), -i * 30);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      const scores = buckets.get(key);
      if (scores && scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const dominantScore = Math.round(avg);
        const moodIds = ["angry", "sad", "neutral", "happy", "amazing"];
        moodTrend.push({ date: key, moodId: moodIds[dominantScore - 1] ?? "neutral", avgScore: +avg.toFixed(1) });
      } else {
        moodTrend.push({ date: key, moodId: null });
      }
    }
  } else {
    moodTrend = dailyTrend;
  }

  // backward compat: last7 always 7 days
  const last7 = dailyTrend.slice(-7);

  // avg mood score
  const scored = currentRows.map((r) => moodScore(r.moodTypeId));
  const avgScore = scored.length > 0 ? +(scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(2) : null;

  // prev period avg for delta
  const prevScored = prevRows.map((r) => moodScore(r.moodTypeId));
  const prevAvgScore = prevScored.length > 0 ? +(prevScored.reduce((a, b) => a + b, 0) / prevScored.length).toFixed(2) : null;
  const avgScoreDelta = avgScore != null && prevAvgScore != null ? +(avgScore - prevAvgScore).toFixed(2) : null;

  // best day (highest mood)
  const bestDayBase = moodTrend.reduce<{ date: string; moodId: string; score: number } | null>(
    (best, d) => {
      if (!d.moodId) return best;
      const s = moodScore(d.moodId);
      if (!best || s > best.score) return { date: d.date, moodId: d.moodId, score: s };
      return best;
    },
    null,
  );
  const bestDayEntries = bestDayBase ? [...(perDay.get(bestDayBase.date)?.values() ?? [])].reduce((a, b) => a + b, 0) : 0;
  const bestDay = bestDayBase ? { ...bestDayBase, entries: bestDayEntries } : null;

  // activity impact: tag → avg mood correlation
  const overallAvg = avgScore ?? 3;
  const tagScores = new Map<string, number[]>();
  for (const r of currentRows) {
    const tags = (r.tags as string[] | null) ?? [];
    const s = moodScore(r.moodTypeId);
    for (const t of tags) {
      const arr = tagScores.get(t) ?? [];
      arr.push(s);
      tagScores.set(t, arr);
    }
  }

  const activityImpact: { tag: string; impact: number; freq: number }[] = [];
  for (const [tag, scores] of tagScores) {
    if (scores.length < 5) continue;
    const tagAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const impact = Math.round(((tagAvg - overallAvg) / 4) * 100);
    activityImpact.push({ tag, impact: Math.max(-100, Math.min(100, impact)), freq: scores.length });
  }
  activityImpact.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  activityImpact.splice(6);

  const streak = computeStreak(new Set(perDay.keys()));

  return NextResponse.json({
    streak,
    todayMood,
    last7,
    moodTrend,
    distribution,
    total: currentRows.length,
    total30d: currentRows.length,
    period,
    avgScore,
    avgScoreDelta,
    bestDay,
    activityImpact,
  });
}

function topMood(counts: Map<string, number>): string {
  let best = "";
  let max = -1;
  for (const [k, v] of counts) if (v > max) ((best = k), (max = v));
  return best;
}
