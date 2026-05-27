import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export async function POST() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  await getDb()
    .update(users)
    .set({ welcomeShownAt: new Date() })
    .where(and(eq(users.id, userId), isNull(users.welcomeShownAt)));

  return NextResponse.json({ ok: true });
}
