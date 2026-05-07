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
    .limit(200);

  if (rows.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const payload = JSON.stringify({
    locale,
    totalEntries: rows.length,
    entries: rows.map((r) => ({
      date: r.date,
      mood: r.moodTypeId,
      note: r.note?.slice(0, 120) ?? null,
      tags: r.tags ?? [],
      sentiment: r.sentiment,
      hour: r.createdAt.getHours(),
      dayOfWeek: r.createdAt.toLocaleDateString("en-US", { weekday: "short" }),
    })),
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
