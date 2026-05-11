import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";


const MOOD_SCORES: Record<string, number> = {
  amazing: 5,
  happy: 4,
  neutral: 3,
  sad: 2,
  angry: 1,
  anxious: 2,
  tired: 2,
};

export async function GET(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const monthParam = url.searchParams.get("month");

  const db = getDb();

  if (monthParam) {
    const month = parseInt(monthParam, 10);
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const rows = await db
      .select({ date: moodEntries.date, moodTypeId: moodEntries.moodTypeId })
      .from(moodEntries)
      .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, from), lte(moodEntries.date, to)))
      .orderBy(desc(moodEntries.createdAt));

    const dayMap = new Map<string, string>();
    let totalScore = 0;
    let scoreCount = 0;
    for (const r of rows) {
      if (!dayMap.has(r.date)) dayMap.set(r.date, r.moodTypeId);
      const s = MOOD_SCORES[r.moodTypeId];
      if (s !== undefined) { totalScore += s; scoreCount++; }
    }

    const avgMood = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : null;

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevFrom = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevTo = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

    const prevRows = await db
      .select({ moodTypeId: moodEntries.moodTypeId })
      .from(moodEntries)
      .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, prevFrom), lte(moodEntries.date, prevTo)));

    let prevTotal = 0;
    let prevCount = 0;
    for (const r of prevRows) {
      const s = MOOD_SCORES[r.moodTypeId];
      if (s !== undefined) { prevTotal += s; prevCount++; }
    }
    const prevAvg = prevCount > 0 ? prevTotal / prevCount : null;
    const avgMoodDelta = avgMood !== null && prevAvg !== null
      ? Math.round((avgMood - prevAvg) * 10) / 10
      : null;

    // Streak: walk backwards from today
    const today = ymd(new Date());
    let streak = 0;
    const allDates = new Set(rows.map((r) => r.date));
    // Need to also check beyond this month for streak
    if (allDates.has(today) || dayMap.size > 0) {
      // Fetch last 60 days for streak calculation
      const streakFrom = ymd(addDays(new Date(), -59));
      const streakRows = await db
        .select({ date: moodEntries.date })
        .from(moodEntries)
        .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, streakFrom)));
      const streakDates = new Set(streakRows.map((r) => r.date));
      for (let i = 0; ; i++) {
        if (streakDates.has(ymd(addDays(new Date(), -i)))) streak++;
        else break;
      }
    }

    const entries = Array.from(dayMap.entries()).map(([date, moodTypeId]) => ({ date, moodTypeId }));

    return NextResponse.json({
      entries,
      stats: {
        avgMood,
        avgMoodDelta,
        streak,
        loggedDays: dayMap.size,
        totalDays: lastDay,
      },
    });
  }

  // Year view — no month specified
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const rows = await db
    .select({ date: moodEntries.date, moodTypeId: moodEntries.moodTypeId })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, from), lte(moodEntries.date, to)))
    .orderBy(desc(moodEntries.createdAt));

  const dayMap = new Map<string, string>();
  for (const r of rows) {
    if (!dayMap.has(r.date)) dayMap.set(r.date, r.moodTypeId);
  }

  const entries = Array.from(dayMap.entries()).map(([date, moodTypeId]) => ({ date, moodTypeId }));
  return NextResponse.json({ entries });
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}
