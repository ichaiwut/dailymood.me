import { NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { moodScore, ymd, addDays } from "@/lib/mood-scores";

export async function GET() {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const db = getDb();
  const start = ymd(addDays(new Date(), -29));

  const rows = await db
    .select({
      moodTypeId: moodEntries.moodTypeId,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(200);

  if (rows.length < 7) {
    return NextResponse.json({ tooFewEntries: true });
  }

  // Bucket by hour
  const hourBuckets: { sum: number; count: number }[] = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));

  for (const r of rows) {
    const hour = r.createdAt.getHours();
    const score = moodScore(r.moodTypeId);
    hourBuckets[hour].sum += score;
    hourBuckets[hour].count += 1;
  }

  // Compute hourly averages, smooth with window=3
  const raw = hourBuckets.map((b) => (b.count > 0 ? b.sum / b.count : 0));
  const hourly: number[] = raw.map((_, i) => {
    const prev = raw[(i + 23) % 24];
    const curr = raw[i];
    const next = raw[(i + 1) % 24];
    const vals = [prev, curr, next].filter((v) => v > 0);
    return vals.length > 0 ? +(vals.reduce((s, v) => s + v, 0) / vals.length / 5).toFixed(2) : 0;
  });

  let peakHour = 0;
  let troughHour = 0;
  let maxVal = -1;
  let minVal = 2;

  for (let i = 0; i < 24; i++) {
    if (hourly[i] > 0 && hourly[i] > maxVal) { maxVal = hourly[i]; peakHour = i; }
    if (hourly[i] > 0 && hourly[i] < minVal) { minVal = hourly[i]; troughHour = i; }
  }

  return NextResponse.json({ hourly, peakHour, troughHour });
}
