import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { generateInsights, type InsightsResult } from "@/lib/gemini";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";

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

  const result: InsightsResult = await generateInsights(payload);
  return NextResponse.json(result);
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
