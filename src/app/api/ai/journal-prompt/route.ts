import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, journalPromptCache } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { generateJournalPrompt } from "@/lib/gemini";
import { getStaticPrompt } from "@/lib/journal-prompts";
import { todayKey } from "@/lib/usage";
import { DEFAULT_MOODS } from "@/lib/default-moods";

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const moodId = (url.searchParams.get("moodId") ?? "neutral").slice(0, 50);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "th";
  const moodLabel = (url.searchParams.get("moodLabel") ?? "").slice(0, 60);

  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({ prompt: getStaticPrompt(moodId, locale), source: "static" });
  }

  const dateKey = todayKey();
  const db = getDb();

  try {
    const [cached] = await db
      .select({ prompt: journalPromptCache.prompt })
      .from(journalPromptCache)
      .where(and(
        eq(journalPromptCache.userId, userId),
        eq(journalPromptCache.moodId, moodId),
        eq(journalPromptCache.dateKey, dateKey),
        eq(journalPromptCache.locale, locale),
      ))
      .limit(1);
    if (cached) return NextResponse.json({ prompt: cached.prompt, source: "cached" });
  } catch {
    // table may not exist yet
  }

  const recentEntries = await db
    .select({ moodTypeId: moodEntries.moodTypeId, tags: moodEntries.tags })
    .from(moodEntries)
    .where(eq(moodEntries.userId, userId))
    .orderBy(desc(moodEntries.createdAt))
    .limit(7);

  const tagFreq: Record<string, number> = {};
  for (const e of recentEntries) {
    for (const t of (e.tags as string[] | null) ?? []) {
      tagFreq[t] = (tagFreq[t] ?? 0) + 1;
    }
  }
  const recentTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  const recentMoods = recentEntries.slice(0, 3).map((e) => e.moodTypeId);
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const resolvedLabel =
    (locale === "th"
      ? DEFAULT_MOODS.find((m) => m.id === moodId)?.labelTh
      : DEFAULT_MOODS.find((m) => m.id === moodId)?.label)
    || moodLabel
    || moodId;

  const payload = JSON.stringify({
    locale,
    moodId,
    moodLabel: resolvedLabel,
    recentTags,
    recentMoods,
    dayOfWeek,
  });

  try {
    const { prompt } = await generateJournalPrompt(payload);

    try {
      await db
        .insert(journalPromptCache)
        .values({ userId, moodId, dateKey, locale, prompt, generatedAt: new Date() })
        .onConflictDoUpdate({
          target: [journalPromptCache.userId, journalPromptCache.moodId, journalPromptCache.dateKey, journalPromptCache.locale],
          set: { prompt, generatedAt: new Date() },
        });
    } catch {
      // table may not exist yet
    }

    return NextResponse.json({ prompt, source: "generated" });
  } catch {
    return NextResponse.json({ prompt: getStaticPrompt(moodId, locale), source: "static" });
  }
}
