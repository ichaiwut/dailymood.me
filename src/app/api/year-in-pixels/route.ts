import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, yearAiCache } from "@/db/schema";
import type { YearAiResult } from "@/db/schema";
import { generateYearAi } from "@/lib/gemini";
import { and, eq, gte, lte, desc } from "drizzle-orm";

const MOOD_SCORES: Record<string, number> = {
  amazing: 5, happy: 4, neutral: 3, sad: 2, angry: 1, anxious: 2, tired: 2,
};
const MOOD_EMOJIS: Record<string, string> = {
  amazing: "😄", happy: "🙂", neutral: "😐", sad: "😔", angry: "😠", anxious: "😟", tired: "😴",
};

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const locale = url.searchParams.get("locale") ?? "th";
  if (isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "invalid_year" }, { status: 400 });
  }

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const db = getDb();
  const rows = await db
    .select({
      moodTypeId: moodEntries.moodTypeId,
      date: moodEntries.date,
      tags: moodEntries.tags,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, from), lte(moodEntries.date, to)))
    .orderBy(desc(moodEntries.createdAt));

  const dayMap: Record<string, string> = {};
  for (const r of rows) {
    if (!dayMap[r.date]) dayMap[r.date] = r.moodTypeId;
  }

  const totalDays = Object.keys(dayMap).length;
  const currentCount = rows.length;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;

  const monthScores: Record<number, { total: number; count: number }> = {};
  const moodCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  for (const r of rows) {
    const date = r.date;
    const moodId = r.moodTypeId;
    const m = parseInt(date.slice(5, 7), 10);
    if (!monthScores[m]) monthScores[m] = { total: 0, count: 0 };
    if (dayMap[date] === moodId) {
      monthScores[m].total += MOOD_SCORES[moodId] ?? 3;
      monthScores[m].count += 1;
    }
    moodCounts[moodId] = (moodCounts[moodId] ?? 0) + 1;
    const tags = r.tags as string[] | null;
    if (tags) for (const t of tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }

  let bestMonth = { month: 0, avg: 0 };
  let hardMonth = { month: 0, avg: 6 };
  for (const [m, s] of Object.entries(monthScores)) {
    const avg = s.count > 0 ? s.total / s.count : 0;
    if (avg > bestMonth.avg) bestMonth = { month: +m, avg };
    if (avg < hardMonth.avg && s.count >= 3) hardMonth = { month: +m, avg };
  }

  let dominantMood = "";
  let dominantCount = 0;
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (count > dominantCount) { dominantMood = mood; dominantCount = count; }
  }
  const dominantPct = totalDays > 0 ? Math.round((dominantCount / totalDays) * 100) : 0;

  const q4Months = [10, 11, 12];
  const q3Months = [7, 8, 9];
  let q4Avg = 0, q4Count = 0, q3Avg = 0, q3Count = 0;
  for (const m of q4Months) {
    if (monthScores[m]) { q4Avg += monthScores[m].total; q4Count += monthScores[m].count; }
  }
  for (const m of q3Months) {
    if (monthScores[m]) { q3Avg += monthScores[m].total; q3Count += monthScores[m].count; }
  }
  const q4Score = q4Count > 0 ? q4Avg / q4Count : 0;
  const q3Score = q3Count > 0 ? q3Avg / q3Count : 0;
  const trendPct = q3Score > 0 ? Math.round(((q4Score - q3Score) / q3Score) * 100) : 0;

  let topTrigger = "";
  let topTriggerCount = 0;
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count > topTriggerCount) { topTrigger = tag; topTriggerCount = count; }
  }

  const sortedDates = Object.keys(dayMap).sort();
  let maxStreak = 0, curStreak = 0, streakMonth = "";
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { curStreak = 1; }
    else {
      const prev = new Date(sortedDates[i - 1] + "T12:00:00");
      const curr = new Date(sortedDates[i] + "T12:00:00");
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      curStreak = diff === 1 ? curStreak + 1 : 1;
    }
    if (curStreak > maxStreak) {
      maxStreak = curStreak;
      const startDate = sortedDates[i - curStreak + 1];
      streakMonth = startDate ? startDate.slice(5, 7) : "";
    }
  }

  // AI Summary — cache with 5-entry delta invalidation
  let aiSummary: YearAiResult | null = null;
  if (totalDays >= 20) {
    const yearStr = String(year);
    const [cached] = await db
      .select({ result: yearAiCache.result, entryCount: yearAiCache.entryCount })
      .from(yearAiCache)
      .where(and(eq(yearAiCache.userId, userId), eq(yearAiCache.year, yearStr)))
      .limit(1);

    if (cached && Math.abs(currentCount - cached.entryCount) < 5) {
      aiSummary = cached.result;
    } else {
      const monthlyData = Array.from({ length: 12 }, (_, mi) => {
        const m = mi + 1;
        const ms = monthScores[m];
        return {
          month: m,
          avg: ms && ms.count > 0 ? Math.round((ms.total / ms.count) * 10) / 10 : null,
          count: ms?.count ?? 0,
        };
      });
      const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, c]) => `${t}:${c}`);

      const payload = JSON.stringify({
        locale,
        year,
        totalDays,
        daysInYear,
        monthlyData,
        moodCounts,
        topTags,
        moodEmojis: MOOD_EMOJIS,
        bestMonth: bestMonth.month > 0 ? bestMonth : null,
        hardMonth: hardMonth.month > 0 && hardMonth.avg < 6 ? hardMonth : null,
        dominantMood,
        dominantPct,
        trendQ4Pct: trendPct,
        longestStreak: maxStreak,
      });

      try {
        aiSummary = await generateYearAi(payload);
        await db
          .insert(yearAiCache)
          .values({ userId, year: yearStr, result: aiSummary, entryCount: currentCount, generatedAt: new Date() })
          .onConflictDoUpdate({
            target: [yearAiCache.userId, yearAiCache.year],
            set: { result: aiSummary, entryCount: currentCount, generatedAt: new Date() },
          });
      } catch { /* AI failed — return stats without summary */ }
    }
  }

  return NextResponse.json({
    year,
    dayMap,
    totalDays,
    daysInYear,
    bestMonth: bestMonth.month > 0 ? { month: bestMonth.month, avg: Math.round(bestMonth.avg * 10) / 10 } : null,
    hardMonth: hardMonth.month > 0 && hardMonth.avg < 6 ? { month: hardMonth.month, avg: Math.round(hardMonth.avg * 10) / 10 } : null,
    dominantMood,
    dominantPct,
    trendQ4: { pct: trendPct },
    topTrigger: topTrigger ? { tag: topTrigger, count: topTriggerCount } : null,
    streak: { days: maxStreak, month: streakMonth ? parseInt(streakMonth, 10) : 0 },
    aiSummary,
  });
}
