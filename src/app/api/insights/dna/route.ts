import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { moodScore, ymd, addDays } from "@/lib/mood-scores";
import { generateDna } from "@/lib/gemini";
import { getCached, setCached } from "@/lib/ai-cache";

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";

  const cacheKey = `dna:${userId}:${locale}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  const db = getDb();
  const start = ymd(addDays(new Date(), -29));

  const rows = await db
    .select({
      moodTypeId: moodEntries.moodTypeId,
      note: moodEntries.note,
      tags: moodEntries.tags,
      sentiment: moodEntries.sentiment,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(100);

  if (rows.length < 7) {
    return NextResponse.json({ tooFewEntries: true });
  }

  // Compute 5 axes (0-40 scale)
  const scores = rows.map((r) => moodScore(r.moodTypeId));
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const highMoodPct = scores.filter((s) => s >= 4).length / scores.length;

  const sentiments = rows.map((r) => r.sentiment).filter((s): s is number => s != null);
  const avgSentiment = sentiments.length > 0 ? sentiments.reduce((s, v) => s + v, 0) / sentiments.length : 0;
  const variance = scores.length > 1 ? scores.reduce((s, v) => s + (v - avgScore) ** 2, 0) / scores.length : 1;

  const allTags = rows.flatMap((r) => (r.tags as string[] | null) ?? []);
  const activityTags = allTags.filter((t) => ["ออกกำลังกาย", "เดิน", "วิ่ง", "gym", "exercise", "walk", "run", "yoga", "sport"].some((k) => t.toLowerCase().includes(k)));
  const socialTags = allTags.filter((t) => ["เพื่อน", "ครอบครัว", "แฟน", "friend", "family", "partner", "social", "party", "คุย"].some((k) => t.toLowerCase().includes(k)));

  const noteLengths = rows.map((r) => (r.note ?? "").length);
  const avgNoteLength = noteLengths.reduce((s, v) => s + v, 0) / noteLengths.length;

  const axes = {
    bright: Math.min(40, Math.round(highMoodPct * 40)),
    calm: Math.min(40, Math.round(((1 - Math.min(variance, 2) / 2) * 0.5 + (avgSentiment + 1) / 2 * 0.5) * 40)),
    energy: Math.min(40, Math.round((activityTags.length / Math.max(rows.length, 1)) * 120 + 8)),
    social: Math.min(40, Math.round((socialTags.length / Math.max(rows.length, 1)) * 120 + 5)),
    depth: Math.min(40, Math.round(Math.min(avgNoteLength / 60, 1) * 35 + 5)),
  };

  const payload = JSON.stringify({ locale, axes, avgScore: +avgScore.toFixed(1), n: rows.length });
  const result = await generateDna(payload);
  const response = { ...result, axes };

  setCached(cacheKey, response);

  return NextResponse.json(response);
}
