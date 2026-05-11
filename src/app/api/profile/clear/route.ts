import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, aiUsage, calendarAiCache, insightsAiCache, suggestionFeedback, userAchievements } from "@/db/schema";
import { eq } from "drizzle-orm";


export async function DELETE() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();

  await db.delete(moodEntries).where(eq(moodEntries.userId, userId));
  await db.delete(aiUsage).where(eq(aiUsage.userId, userId));
  await db.delete(calendarAiCache).where(eq(calendarAiCache.userId, userId));
  await db.delete(insightsAiCache).where(eq(insightsAiCache.userId, userId));
  await db.delete(suggestionFeedback).where(eq(suggestionFeedback.userId, userId));
  await db.delete(userAchievements).where(eq(userAchievements.userId, userId));

  return NextResponse.json({ ok: true });
}
