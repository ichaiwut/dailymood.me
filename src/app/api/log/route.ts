import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { getSignedReadUrl } from "@/lib/r2";
import { and, desc, eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD; default today
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

  const db = getDb();
  const where = date
    ? and(eq(moodEntries.userId, userId), eq(moodEntries.date, date))
    : eq(moodEntries.userId, userId);
  const rows = await db
    .select()
    .from(moodEntries)
    .where(where)
    .orderBy(desc(moodEntries.createdAt))
    .limit(limit);

  // Hydrate signed image URLs
  const out = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      imageUrl: r.imageKey ? await getSignedReadUrl(r.imageKey) : null,
    })),
  );

  return NextResponse.json({ entries: out });
}
