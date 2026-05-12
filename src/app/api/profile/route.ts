import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users, moodEntries, moodTypes, moodPacks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { moodScore, addDays, computeStreak, scoreToEmoji, ymd } from "@/lib/mood-scores";


export async function GET() {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      locale: users.locale,
      isPremium: users.isPremium,
      bio: users.bio,
      accentColor: users.accentColor,
      hidePreview: users.hidePreview,
      anonymousInsights: users.anonymousInsights,
      reminderEnabled: users.reminderEnabled,
      reminderTime: users.reminderTime,
      reminderDays: users.reminderDays,
      moodPack: users.moodPack,
      createdAt: users.createdAt,
      currentPeriodEnd: users.currentPeriodEnd,
      cancelAtPeriodEnd: users.cancelAtPeriodEnd,
      planInterval: users.planInterval,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const thirtyDaysAgo = ymd(addDays(new Date(), -29));

  const allEntries = await db
    .select({ date: moodEntries.date, moodTypeId: moodEntries.moodTypeId })
    .from(moodEntries)
    .where(eq(moodEntries.userId, userId))
    .orderBy(desc(moodEntries.createdAt));

  const totalEntries = allEntries.length;
  const uniqueDates = new Set(allEntries.map((e) => e.date));
  const streak = computeStreak(uniqueDates);

  const recentEntries = allEntries.filter((e) => e.date >= thirtyDaysAgo);
  const scored = recentEntries.map((e) => moodScore(e.moodTypeId));
  const avgMood = scored.length > 0
    ? +(scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1)
    : null;

  const moods = await db
    .select({ id: moodTypes.id, label: moodTypes.label, labelTh: moodTypes.labelTh, color: moodTypes.color, emoji: moodTypes.emoji })
    .from(moodTypes)
    .where(eq(moodTypes.isDefault, true));

  const moodMap = new Map(moods.map((m) => [m.id, m]));

  const dist: Record<string, number> = {};
  for (const e of recentEntries) {
    dist[e.moodTypeId] = (dist[e.moodTypeId] ?? 0) + 1;
  }

  const total30 = recentEntries.length;
  const distribution = Object.entries(dist)
    .map(([moodId, count]) => {
      const mood = moodMap.get(moodId);
      return {
        moodId,
        label: mood?.label ?? moodId,
        labelTh: mood?.labelTh ?? null,
        color: mood?.color ?? "#999",
        emoji: mood?.emoji ?? "",
        percent: total30 > 0 ? Math.round((count / total30) * 100) : 0,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: !!user.emailVerified,
      image: user.image,
      locale: user.locale,
      isPremium: user.isPremium,
      bio: user.bio,
      accentColor: user.accentColor,
      hidePreview: user.hidePreview,
      anonymousInsights: user.anonymousInsights,
      reminderEnabled: user.reminderEnabled,
      reminderTime: user.reminderTime,
      reminderDays: user.reminderDays,
      moodPack: user.moodPack,
      createdAt: user.createdAt.toISOString(),
      currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      planInterval: user.planInterval ?? null,
    },
    stats: {
      streak,
      totalEntries,
      avgMood,
      avgMoodEmoji: avgMood ? scoreToEmoji(avgMood) : null,
    },
    moodSignature: {
      distribution,
      hasSufficientData: total30 >= 3,
    },
    tier,
  });
}

export async function PATCH(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const body = (await req.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = (body.name as string).trim().slice(0, 30);
    if (name.length > 0) updates.name = name;
  }
  if (typeof body.bio === "string") {
    updates.bio = (body.bio as string).trim().slice(0, 160) || null;
  }
  if (typeof body.accentColor === "string") {
    const valid = ["#A673F1", "#FCA45B", "#85ECCB", "#FDCB56", "#9ACDE2", "#D4BEE4"];
    if (valid.includes(body.accentColor as string)) updates.accentColor = body.accentColor;
  }
  if (typeof body.locale === "string" && ["en", "th"].includes(body.locale as string)) {
    updates.locale = body.locale;
  }
  if (typeof body.hidePreview === "boolean") {
    updates.hidePreview = body.hidePreview;
  }
  if (typeof body.anonymousInsights === "boolean") {
    updates.anonymousInsights = body.anonymousInsights;
  }
  if (typeof body.reminderEnabled === "boolean") {
    updates.reminderEnabled = body.reminderEnabled;
  }
  if (typeof body.reminderTime === "string" && /^\d{2}:\d{2}$/.test(body.reminderTime as string)) {
    updates.reminderTime = body.reminderTime;
  }
  if (typeof body.reminderDays === "string" && /^[0-6](,[0-6]){0,6}$/.test(body.reminderDays as string)) {
    updates.reminderDays = body.reminderDays;
  }
  if (typeof body.moodPack === "string") {
    const packId = body.moodPack as string;
    const [pack] = await db
      .select({ id: moodPacks.id, premium: moodPacks.premium })
      .from(moodPacks)
      .where(eq(moodPacks.id, packId))
      .limit(1);
    if (!pack) return NextResponse.json({ error: "invalid_pack" }, { status: 400 });
    if (pack.premium && tier !== "premium") {
      return NextResponse.json({ error: "premium_required" }, { status: 403 });
    }
    updates.moodPack = packId;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
