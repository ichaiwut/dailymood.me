import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, calendarAiCache } from "@/db/schema";
import type { CalendarAiResult } from "@/db/schema";
import { generateCalendarAi } from "@/lib/gemini";
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
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);
  const locale = url.searchParams.get("locale") ?? "th";

  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

  const db = getDb();

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      tags: moodEntries.tags,
      sentiment: moodEntries.sentiment,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, from), lte(moodEntries.date, to)))
    .orderBy(desc(moodEntries.createdAt));

  const currentCount = rows.length;

  if (currentCount < 5) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevYm = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
    const [prevCache] = await db
      .select({ result: calendarAiCache.result })
      .from(calendarAiCache)
      .where(and(eq(calendarAiCache.userId, userId), eq(calendarAiCache.yearMonth, prevYm)))
      .limit(1);
    if (prevCache) {
      return NextResponse.json({ ...prevCache.result, fallbackMonth: prevYm, tooFewEntries: true });
    }
    return NextResponse.json({ tooFewEntries: true });
  }

  const [cached] = await db
    .select({ result: calendarAiCache.result, entryCount: calendarAiCache.entryCount })
    .from(calendarAiCache)
    .where(and(eq(calendarAiCache.userId, userId), eq(calendarAiCache.yearMonth, yearMonth)))
    .limit(1);

  if (cached && Math.abs(currentCount - cached.entryCount) < 3) {
    return NextResponse.json({ ...cached.result, cached: true });
  }

  const dayMap = new Map<string, { mood: string; score: number; tags: string[] }>();
  const moodCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const dowCounts: Record<string, number> = {};

  for (const r of rows) {
    if (!dayMap.has(r.date)) {
      dayMap.set(r.date, {
        mood: r.moodTypeId,
        score: MOOD_SCORES[r.moodTypeId] ?? 3,
        tags: (r.tags as string[] | null) ?? [],
      });
    }
    moodCounts[r.moodTypeId] = (moodCounts[r.moodTypeId] ?? 0) + 1;
    for (const t of (r.tags as string[] | null) ?? []) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
    const d = new Date(r.date + "T12:00:00");
    const dow = d.toLocaleDateString("en-US", { weekday: "short" });
    dowCounts[dow] = (dowCounts[dow] ?? 0) + 1;
  }

  const days = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, mood: v.mood, score: v.score, tags: v.tags }));

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t, c]) => `${t}:${c}`);

  const payload = JSON.stringify({
    locale,
    yearMonth,
    n: currentCount,
    days,
    moodCounts,
    topTags,
    dowCounts,
    moodEmojis: MOOD_EMOJIS,
  });

  try {
    const raw = await generateCalendarAi(payload);
    const result: CalendarAiResult = {
      ...raw,
      highlights: {
        bestDay: raw.highlights?.bestDay?.date ? raw.highlights.bestDay : null,
        hardDay: raw.highlights?.hardDay?.date ? raw.highlights.hardDay : null,
        topTag: raw.highlights?.topTag || null,
      },
    };

    await db
      .insert(calendarAiCache)
      .values({
        userId,
        yearMonth,
        result,
        entryCount: currentCount,
        generatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [calendarAiCache.userId, calendarAiCache.yearMonth],
        set: {
          result,
          entryCount: currentCount,
          generatedAt: new Date(),
        },
      });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 500 });
  }
}
