import { and, eq } from "drizzle-orm";
import { chartAnnotationsCache } from "@/db/schema";
import type { ChartAnnotation } from "@/db/schema";
import { generateChartAnnotations } from "@/lib/gemini";
import { moodScore, chartAnnotationPeriodKey } from "@/lib/mood-scores";
import type { DB } from "@/lib/cf";

type Period = "week" | "month" | "year";

export async function getOrGenerateAnnotations(
  db: DB,
  userId: string,
  period: Period,
  moodTrend: { date: string; moodId: string | null }[],
  tagsByDate: Map<string, string[]>,
  activityByDate: Map<string, string>,
  currentEntryCount: number,
  locale: string,
): Promise<ChartAnnotation[]> {
  const periodKey = chartAnnotationPeriodKey(period, new Date());

  try {
    const [cached] = await db
      .select()
      .from(chartAnnotationsCache)
      .where(and(
        eq(chartAnnotationsCache.userId, userId),
        eq(chartAnnotationsCache.periodKey, periodKey),
      ))
      .limit(1);

    const threshold = period === "year" ? 5 : 3;
    if (cached && Math.abs(currentEntryCount - cached.entryCount) < threshold) {
      return cached.result.annotations;
    }
  } catch {
    // table may not exist yet
  }

  const validPoints = moodTrend.filter((d) => d.moodId !== null);
  if (validPoints.length < 3) return [];

  const scores = validPoints.map((d) => moodScore(d.moodId!));
  const overallAvg = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);

  const payload = JSON.stringify({
    locale,
    period,
    overallAvg,
    points: validPoints.map((d) => ({
      date: d.date,
      score: moodScore(d.moodId!),
      tags: tagsByDate.get(d.date) ?? [],
      activity: activityByDate.get(d.date) ?? null,
    })),
  });

  try {
    const result = await generateChartAnnotations(payload);

    try {
      await db
        .insert(chartAnnotationsCache)
        .values({ userId, periodKey, result, entryCount: currentEntryCount, generatedAt: new Date() })
        .onConflictDoUpdate({
          target: [chartAnnotationsCache.userId, chartAnnotationsCache.periodKey],
          set: { result, entryCount: currentEntryCount, generatedAt: new Date() },
        });
    } catch {
      // table may not exist yet
    }

    return result.annotations;
  } catch {
    return [];
  }
}
