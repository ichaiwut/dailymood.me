import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { sql, like, or, eq, desc, and } from "drizzle-orm";
import { UsersShell } from "@/components/admin/users-shell";


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

  const escaped = q.replace(/[%_\\]/g, "\\$&");
  const searchCond = escaped
    ? or(like(users.email, `%${escaped}%`), like(users.name, `%${escaped}%`))
    : undefined;
  const filterCond =
    filter === "premium" ? eq(users.isPremium, true) :
    filter === "free" ? eq(users.isPremium, false) :
    undefined;
  const where = and(searchCond, filterCond);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isPremium: users.isPremium,
        planInterval: users.planInterval,
        createdAt: users.createdAt,
        entryCount: sql<number>`(SELECT count(*) FROM mood_entries WHERE user_id = ${users.id})`,
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
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    isPremium: r.isPremium,
    planInterval: r.planInterval,
    createdAt: r.createdAt.toISOString(),
    entryCount: r.entryCount,
  }));

  return (
    <UsersShell
      users={data}
      total={total}
      page={page}
      pageSize={pageSize}
      q={q}
      filter={filter}
    />
  );
}
