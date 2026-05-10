import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, userAchievements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BADGE_CATALOG, computeBadgeProgress } from "@/lib/achievements";

export const runtime = "edge";

export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();

  const entries = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      imageKey: moodEntries.imageKey,
      tags: moodEntries.tags,
      createdAt: moodEntries.createdAt,
    })
    .from(moodEntries)
    .where(eq(moodEntries.userId, userId));

  const progress = computeBadgeProgress(entries);

  const earned = await db
    .select({ badgeId: userAchievements.badgeId, earnedAt: userAchievements.earnedAt })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

  const newlyEarned: string[] = [];
  for (const badge of BADGE_CATALOG) {
    const p = progress[badge.id];
    if (p && p.current >= p.target && !earnedMap.has(badge.id)) {
      newlyEarned.push(badge.id);
    }
  }

  if (newlyEarned.length > 0) {
    const now = new Date();
    await db.insert(userAchievements).values(
      newlyEarned.map((badgeId) => ({
        userId,
        badgeId,
        earnedAt: now,
      }))
    ).onConflictDoNothing();
    for (const id of newlyEarned) earnedMap.set(id, new Date());
  }

  const badges = BADGE_CATALOG.map((badge) => {
    const p = progress[badge.id] ?? { current: 0, target: badge.target };
    const earnedAt = earnedMap.get(badge.id);
    const status: "earned" | "in_progress" | "locked" = earnedAt
      ? "earned"
      : p.current > 0
        ? "in_progress"
        : "locked";

    return {
      id: badge.id,
      icon: badge.icon,
      color: badge.color,
      target: badge.target,
      current: p.current,
      progress: Math.round((p.current / p.target) * 100),
      status,
      earnedAt: earnedAt?.toISOString() ?? null,
    };
  });

  const earnedCount = badges.filter((b) => b.status === "earned").length;
  const inProgressCount = badges.filter((b) => b.status === "in_progress").length;
  const lockedCount = badges.filter((b) => b.status === "locked").length;

  return NextResponse.json({
    total: badges.length,
    earned: earnedCount,
    inProgress: inProgressCount,
    locked: lockedCount,
    badges,
  });
}
