import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { moodScore, ymd, addDays } from "@/lib/mood-scores";
import { getCached, setCached } from "@/lib/ai-cache";

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const locale = new URL(req.url).searchParams.get("locale") ?? "th";
  const cacheKey = `suggested:${userId}:${locale}`;
  const cached = getCached<{ questions: string[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const db = getDb();
  const start = ymd(addDays(new Date(), -29));

  const entries = await db
    .select({ date: moodEntries.date, moodTypeId: moodEntries.moodTypeId, tags: moodEntries.tags })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(50);

  if (entries.length < 3) {
    const q = locale === "th"
      ? ["อารมณ์ของฉันสัปดาห์นี้เป็นอย่างไร?", "วันไหนที่ฉันรู้สึกดีที่สุด?", "ฉันมี pattern อะไรบ้าง?"]
      : ["How was my mood this week?", "Which day did I feel best?", "What patterns do I have?"];
    return NextResponse.json({ questions: q });
  }

  // Build personalized questions from data
  const tagCounts: Record<string, number> = {};
  const dayScores: Record<string, number[]> = {};
  for (const e of entries) {
    for (const t of (e.tags as string[] | null) ?? []) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    const dow = new Date(e.date + "T12:00:00").toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "long" });
    if (!dayScores[dow]) dayScores[dow] = [];
    dayScores[dow].push(moodScore(e.moodTypeId));
  }

  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const secondTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[1]?.[0];

  let worstDay = "";
  let lowestAvg = 6;
  for (const [dow, scores] of Object.entries(dayScores)) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (avg < lowestAvg) { lowestAvg = avg; worstDay = dow; }
  }

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long" });

  const questions = locale === "th" ? [
    worstDay ? `ทำไม${worstDay}ของฉันมักจะไม่ค่อยดี?` : "วันไหนที่ฉันมักรู้สึกไม่ดี?",
    topTag && secondTag ? `${topTag} กับ ${secondTag} อันไหนทำให้ฉันรู้สึกดีกว่า?` : "อะไรทำให้ฉันรู้สึกดีที่สุด?",
    `สรุปอารมณ์เดือน${lastMonth}ให้หน่อย`,
  ] : [
    worstDay ? `Why does ${worstDay} tend to be my worst day?` : "Which day do I usually feel worst?",
    topTag && secondTag ? `${topTag} vs ${secondTag} — which makes me feel better?` : "What makes me feel best?",
    `Summarize my mood in ${lastMonth}`,
  ];

  const result = { questions };
  setCached(cacheKey, result);
  return NextResponse.json(result);
}
