import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { moodEntries, users, moodTypes } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { EntriesShell } from "@/components/admin/entries-shell";


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

  const where = userId ? eq(moodEntries.userId, userId) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: moodEntries.id,
        userId: moodEntries.userId,
        userEmail: users.email,
        userName: users.name,
        moodTypeId: moodEntries.moodTypeId,
        moodEmoji: moodTypes.emoji,
        moodLabel: moodTypes.label,
        aiSource: moodEntries.aiSource,
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
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail ?? "—",
    userName: r.userName,
    moodEmoji: r.moodEmoji ?? "",
    moodLabel: r.moodLabel ?? r.moodTypeId,
    aiSource: r.aiSource,
    hasImage: !!r.hasImage,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <EntriesShell
      entries={data}
      total={total}
      page={page}
      pageSize={pageSize}
      userId={userId}
    />
  );
}
