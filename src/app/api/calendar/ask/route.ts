import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { generateAskAi } from "@/lib/gemini";
import { and, eq, gte, lte, desc } from "drizzle-orm";

export const runtime = "edge";

const MOOD_SCORES: Record<string, number> = {
  amazing: 5, happy: 4, neutral: 3, sad: 2, angry: 1, anxious: 2, tired: 2,
};

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    query: string;
    year: number;
    month: number;
    locale: string;
  };

  if (!body.query?.trim()) {
    return NextResponse.json({ error: "query_required" }, { status: 400 });
  }
  if (!Number.isInteger(body.year) || body.year < 2020 || body.year > 2100 || !Number.isInteger(body.month) || body.month < 1 || body.month > 12) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const rl = await rateLimit({ key: `calendar-ask:${userId}`, limit: 10, windowSec: 1800 });
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited", retryAfterSec: rl.retryAfterSec }, { status: 429 });
  }

  const db = getDb();
  const { year, month, locale } = body;
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      note: moodEntries.note,
      tags: moodEntries.tags,
      sentiment: moodEntries.sentiment,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, from), lte(moodEntries.date, to)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(100);

  if (rows.length === 0) {
    return NextResponse.json({ answer: "", matchingDates: [] });
  }

  const days = rows.map((r) => ({
    date: r.date,
    mood: r.moodTypeId,
    score: MOOD_SCORES[r.moodTypeId] ?? 3,
    tags: (r.tags as string[] | null) ?? [],
    note: r.note?.slice(0, 80) ?? null,
  }));

  const payload = JSON.stringify({
    locale,
    question: body.query.trim().slice(0, 300),
    yearMonth: `${year}-${String(month).padStart(2, "0")}`,
    days,
  });

  try {
    const result = await generateAskAi(payload);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 500 });
  }
}
