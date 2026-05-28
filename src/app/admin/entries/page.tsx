import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { moodEntries, users, moodTypes } from "@/db/schema";
import { sql, eq, desc, gte, and, ne } from "drizzle-orm";
import { EntriesShell } from "@/components/admin/entries-shell";
import { ymdICT, todayICT } from "@/lib/timezone";

function daysAgo(n: number): string {
  return ymdICT(new Date(Date.now() - n * 86400_000));
}

export default async function AdminEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const userId = params.userId ?? "";
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
  const pageSize = 50;

  const db = getDb();
  const today = todayICT();
  const yesterday = daysAgo(1);
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  const EXCLUDED_EMAILS = ["ichaiwut.s@gmail.com"];

  const excludeCond = sql`${moodEntries.userId} NOT IN (SELECT id FROM users WHERE email = ANY(${EXCLUDED_EMAILS}))`;
  const where = userId
    ? and(eq(moodEntries.userId, userId), excludeCond)
    : excludeCond;

  const [
    rows,
    [{ total }],
    [{ entriesToday }],
    [{ entriesYesterday }],
    [{ entries7d }],
    [{ entries30d }],
    [{ withImage7d }],
    [{ aiTagged30d }],
    moodDist,
  ] = await Promise.all([
    db
      .select({
        id: moodEntries.id,
        userId: moodEntries.userId,
        userEmail: users.email,
        userName: users.name,
        userImage: users.image,
        moodTypeId: moodEntries.moodTypeId,
        moodEmoji: moodTypes.emoji,
        moodLabel: moodTypes.label,
        moodLabelTh: moodTypes.labelTh,
        moodColor: moodTypes.color,
        aiSource: moodEntries.aiSource,
        note: moodEntries.note,
        tags: moodEntries.tags,
        aiSummary: moodEntries.aiSummary,
        hasImage: sql<boolean>`${moodEntries.imageKey} IS NOT NULL`,
        date: moodEntries.date,
        createdAt: moodEntries.createdAt,
      })
      .from(moodEntries)
      .leftJoin(users, eq(moodEntries.userId, users.id))
      .leftJoin(moodTypes, eq(moodEntries.moodTypeId, moodTypes.id))
      .where(where)
      .orderBy(desc(moodEntries.createdAt))
      .limit(pageSize)
      .offset(page * pageSize),
    db
      .select({ total: sql<number>`count(*)` })
      .from(moodEntries)
      .where(where),
    db
      .select({ entriesToday: sql<number>`count(*)` })
      .from(moodEntries)
      .where(and(eq(moodEntries.date, today), excludeCond)),
    db
      .select({ entriesYesterday: sql<number>`count(*)` })
      .from(moodEntries)
      .where(and(eq(moodEntries.date, yesterday), excludeCond)),
    db
      .select({ entries7d: sql<number>`count(*)` })
      .from(moodEntries)
      .where(and(gte(moodEntries.date, d7), excludeCond)),
    db
      .select({ entries30d: sql<number>`count(*)` })
      .from(moodEntries)
      .where(and(gte(moodEntries.date, d30), excludeCond)),
    db
      .select({ withImage7d: sql<number>`count(*)` })
      .from(moodEntries)
      .where(
        and(
          gte(moodEntries.date, d7),
          sql`${moodEntries.imageKey} IS NOT NULL`,
          excludeCond,
        ),
      ),
    db
      .select({
        aiTagged30d: sql<number>`count(*)`,
      })
      .from(moodEntries)
      .where(
        and(
          gte(moodEntries.date, d30),
          sql`${moodEntries.aiSource} != 'manual'`,
          excludeCond,
        ),
      ),
    db
      .select({
        moodEmoji: moodTypes.emoji,
        moodLabel: moodTypes.label,
        moodLabelTh: moodTypes.labelTh,
        moodColor: moodTypes.color,
        count: sql<number>`count(*)`,
      })
      .from(moodEntries)
      .leftJoin(moodTypes, eq(moodEntries.moodTypeId, moodTypes.id))
      .where(and(gte(moodEntries.date, d30), excludeCond))
      .groupBy(moodTypes.emoji, moodTypes.label, moodTypes.labelTh, moodTypes.color)
      .orderBy(desc(sql`count(*)`)),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail ?? "—",
    userName: r.userName,
    userImage: r.userImage,
    moodEmoji: r.moodEmoji ?? "",
    moodLabel: r.moodLabel ?? r.moodTypeId,
    moodLabelTh: r.moodLabelTh,
    moodColor: r.moodColor,
    aiSource: r.aiSource,
    note: r.note,
    tags: (r.tags as string[] | null) ?? [],
    aiSummary: r.aiSummary,
    hasImage: !!r.hasImage,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
  }));

  const stats = {
    entriesToday: Number(entriesToday),
    entriesYesterday: Number(entriesYesterday),
    entries7d: Number(entries7d),
    entries30d: Number(entries30d),
    withImage7d: Number(withImage7d),
    aiTagged30d: Number(aiTagged30d),
  };

  const moodDistribution = moodDist.map((m) => ({
    emoji: m.moodEmoji ?? "",
    label: m.moodLabel ?? "",
    labelTh: m.moodLabelTh ?? m.moodLabel ?? "",
    color: m.moodColor ?? "var(--ink-3)",
    count: Number(m.count),
  }));

  return (
    <EntriesShell
      entries={data}
      total={total}
      page={page}
      pageSize={pageSize}
      userId={userId}
      stats={stats}
      moodDistribution={moodDistribution}
    />
  );
}
