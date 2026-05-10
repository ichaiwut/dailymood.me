import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodPacks } from "@/db/schema";
import { asc } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({ id: moodPacks.id, label: moodPacks.label, premium: moodPacks.premium })
    .from(moodPacks)
    .orderBy(asc(moodPacks.createdAt));

  return NextResponse.json({ packs: rows });
}
