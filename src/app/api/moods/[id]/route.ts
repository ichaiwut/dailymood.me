import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodTypes } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  // Only allow deleting custom moods owned by this user (never system defaults)
  const result = await db
    .delete(moodTypes)
    .where(and(eq(moodTypes.id, id), eq(moodTypes.userId, userId)));
  return NextResponse.json({ ok: true, result });
}
