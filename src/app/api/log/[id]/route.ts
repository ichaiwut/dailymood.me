import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries } from "@/db/schema";
import { getSignedReadUrl } from "@/lib/r2";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select()
    .from(moodEntries)
    .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const imageUrl = row.imageKey ? await getSignedReadUrl(row.imageKey) : null;

  return NextResponse.json({ ...row, imageUrl, isPremium: tier === "premium" });
}
