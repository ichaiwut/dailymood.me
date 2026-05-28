import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { users, moodEntries } from "@/db/schema";
import { sql, like, or, eq, desc, and, gte } from "drizzle-orm";
import { UsersShell } from "@/components/admin/users-shell";
import { ymdICT } from "@/lib/timezone";


export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = params.q ?? "";
  const filter = params.filter ?? "all";
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
  const pageSize = 50;

  const db = getDb();
  const d30 = ymdICT(new Date(Date.now() - 30 * 86400_000));

  const escaped = q.replace(/[%_\\]/g, "\\$&");
  const searchCond = escaped
    ? or(like(users.email, `%${escaped}%`), like(users.name, `%${escaped}%`))
    : undefined;
  const filterCond =
    filter === "premium" ? eq(users.isPremium, true) :
    filter === "free" ? eq(users.isPremium, false) :
    undefined;
  const where = and(searchCond, filterCond);

  const [rows, [{ total }], [{ active30d }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        isPremium: users.isPremium,
        planInterval: users.planInterval,
        createdAt: users.createdAt,
        entryCount: sql<number>`(SELECT count(*) FROM mood_entries WHERE user_id = ${users.id})`,
        lastEntryDate: sql<string | null>`(SELECT max(date) FROM mood_entries WHERE user_id = ${users.id})`,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(page * pageSize),
    db
      .select({ total: sql<number>`count(*)` })
      .from(users)
      .where(where),
    db
      .select({
        active30d: sql<number>`count(distinct ${moodEntries.userId})`,
      })
      .from(moodEntries)
      .where(gte(moodEntries.date, d30)),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    image: r.image,
    isPremium: r.isPremium,
    planInterval: r.planInterval,
    createdAt: r.createdAt.toISOString(),
    entryCount: Number(r.entryCount),
    lastEntryDate: r.lastEntryDate,
  }));

  return (
    <UsersShell
      users={data}
      total={total}
      active30d={active30d}
      page={page}
      pageSize={pageSize}
      q={q}
      filter={filter}
    />
  );
}
