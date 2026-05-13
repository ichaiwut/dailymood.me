import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { ymd, addDays } from "@/lib/mood-scores";
import { getNlpUsage, FREE_NLP_DAILY_LIMIT } from "@/lib/usage";

export async function GET() {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const start = ymd(addDays(new Date(), -29));

  const rows = await db
    .select({ date: moodEntries.date })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)));

  const entryCount = rows.length;
  const ready = entryCount >= 7;

  let aiQuota: { used: number; limit: number } | null = null;
  if (tier !== "premium") {
    const used = await getNlpUsage(userId);
    aiQuota = { used, limit: FREE_NLP_DAILY_LIMIT };
  }

  return NextResponse.json({ ready, entryCount, aiQuota, tier });
}
