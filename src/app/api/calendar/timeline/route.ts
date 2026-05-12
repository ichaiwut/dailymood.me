import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";


export async function GET(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const now = new Date();
  const year = parseInt(url.searchParams.get("year") ?? String(now.getFullYear()), 10);
  const month = parseInt(url.searchParams.get("month") ?? String(now.getMonth() + 1), 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const db = getDb();
  const rows = await db
    .select({
      id: moodEntries.id,
      moodTypeId: moodEntries.moodTypeId,
      note: moodEntries.note,
      aiSummary: moodEntries.aiSummary,
      tags: moodEntries.tags,
      imageKey: moodEntries.imageKey,
      date: moodEntries.date,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, from), lte(moodEntries.date, to)))
    .orderBy(desc(moodEntries.createdAt));

  const entries = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      imageKey: undefined,
      imageUrl: r.imageKey ? await getSignedReadUrl(r.imageKey) : null,
    })),
  );

  return NextResponse.json({ entries });
}
