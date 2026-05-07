import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";

export const runtime = "edge";

// One single payload that powers the home dashboard.
//
//   streak       = consecutive days (ending today) with at least one entry
//   todayMood    = latest mood logged today (id + createdAt) or null
//   last7        = [{ date, moodId | null }] — dominant mood per day, today last
//   distribution = { moodId: count } over the last 30 days
//   total30d     = total entries in last 30 days
export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const today = ymd(new Date());
  const start = ymd(addDays(new Date(), -29));

  const rows = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(
      and(
        eq(moodEntries.userId, userId),
        gte(moodEntries.date, start),
      ),
    )
    .orderBy(desc(moodEntries.createdAt));

  // distribution + per-day counts in one pass
  const distribution: Record<string, number> = {};
  const perDay = new Map<string, Map<string, number>>(); // date → mood → count
  let todayMood: { moodId: string; createdAt: number } | null = null;

  for (const r of rows) {
    distribution[r.moodTypeId] = (distribution[r.moodTypeId] ?? 0) + 1;
    const day = perDay.get(r.date) ?? new Map<string, number>();
    day.set(r.moodTypeId, (day.get(r.moodTypeId) ?? 0) + 1);
    perDay.set(r.date, day);

    if (r.date === today && !todayMood) {
      todayMood = { moodId: r.moodTypeId, createdAt: r.createdAt.getTime() };
    }
  }

  // last 7 days, oldest → today
  const last7: { date: string; moodId: string | null }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = ymd(addDays(new Date(), -i));
    const counts = perDay.get(d);
    last7.push({ date: d, moodId: counts ? topMood(counts) : null });
  }

  // streak: walk backwards from today
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = ymd(addDays(new Date(), -i));
    if (perDay.has(d)) streak++;
    else break;
  }

  return NextResponse.json({
    streak,
    todayMood,
    last7,
    distribution,
    total30d: rows.length,
  });
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
function topMood(counts: Map<string, number>): string {
  let best = "";
  let max = -1;
  for (const [k, v] of counts) if (v > max) ((best = k), (max = v));
  return best;
}
