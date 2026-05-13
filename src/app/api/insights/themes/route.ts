import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { ymd, addDays } from "@/lib/mood-scores";
import { generateThemes } from "@/lib/gemini";
import { getCached, setCached } from "@/lib/ai-cache";

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";

  const cacheKey = `themes:${userId}:${locale}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  const db = getDb();
  const start = ymd(addDays(new Date(), -29));

  const rows = await db
    .select({
      date: moodEntries.date,
      note: moodEntries.note,
      tags: moodEntries.tags,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(100);

  if (rows.length < 7) {
    return NextResponse.json({ tooFewEntries: true });
  }

  const snippets = rows
    .filter((r) => r.note && r.note.length > 5)
    .map((r) => ({ d: r.date, n: r.note!.slice(0, 80), tags: r.tags }))
    .slice(0, 30);

  const tagCounts: Record<string, number> = {};
  for (const r of rows) {
    for (const t of (r.tags as string[] | null) ?? []) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, c]) => `${t}:${c}`);

  const payload = JSON.stringify({ locale, n: rows.length, snippets, topTags });
  const result = await generateThemes(payload);

  setCached(cacheKey, result);

  return NextResponse.json(result);
}
