import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { moodPacks } from "@/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  await requireAdminAction();
  const db = getDb();
  const rows = await db.select().from(moodPacks).orderBy(desc(moodPacks.createdAt));
  return NextResponse.json({ packs: rows });
}

export async function POST(req: NextRequest) {
  await requireAdminAction();
  const body = await req.json();
  const { id, label, premium } = body as { id: string; label: string; premium: boolean };

  if (!id || !label) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^[a-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const db = getDb();
  await db.insert(moodPacks).values({
    id,
    label,
    premium: !!premium,
  });
  return NextResponse.json({ id });
}
