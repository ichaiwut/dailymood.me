import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { feedbacks, suggestionFeedback, users } from "@/db/schema";
import { sql, eq, desc, and } from "drizzle-orm";
import { FeedbackShell } from "@/components/admin/feedback-shell";


export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
  const pageSize = 50;
  const statusFilter = params.status ?? "all";

  const db = getDb();

  const statusCond =
    statusFilter !== "all" ? eq(feedbacks.status, statusFilter) : undefined;

  const [userFb, [{ totalFeedback }], [{ pendingCount }], suggFb] =
    await Promise.all([
      db
        .select({
          id: feedbacks.id,
          userId: feedbacks.userId,
          email: users.email,
          message: feedbacks.message,
          type: feedbacks.type,
          rating: feedbacks.rating,
          status: feedbacks.status,
          createdAt: feedbacks.createdAt,
        })
        .from(feedbacks)
        .leftJoin(users, eq(feedbacks.userId, users.id))
        .where(statusCond)
        .orderBy(desc(feedbacks.createdAt))
        .limit(pageSize)
        .offset(page * pageSize),
      db
        .select({ totalFeedback: sql<number>`count(*)` })
        .from(feedbacks)
        .where(statusCond),
      db
        .select({ pendingCount: sql<number>`count(*)` })
        .from(feedbacks)
        .where(eq(feedbacks.status, "pending")),
      db
        .select({
          suggestionTitle: suggestionFeedback.suggestionTitle,
          up: sql<number>`sum(case when ${suggestionFeedback.reaction} = 'up' then 1 else 0 end)`,
          down: sql<number>`sum(case when ${suggestionFeedback.reaction} = 'down' then 1 else 0 end)`,
          routine: sql<number>`sum(case when ${suggestionFeedback.reaction} = 'routine' then 1 else 0 end)`,
          total: sql<number>`count(*)`,
        })
        .from(suggestionFeedback)
        .groupBy(suggestionFeedback.suggestionTitle)
        .orderBy(desc(sql`count(*)`))
        .limit(20),
    ]);

  const feedbackRows = userFb.map((r) => ({
    id: r.id,
    userId: r.userId,
    email: r.email ?? "—",
    message: r.message,
    type: r.type,
    rating: r.rating,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  const suggestionRows = suggFb.map((r) => ({
    title: r.suggestionTitle,
    up: r.up,
    down: r.down,
    routine: r.routine,
    total: r.total,
  }));

  return (
    <FeedbackShell
      feedback={feedbackRows}
      totalFeedback={totalFeedback}
      pendingCount={pendingCount}
      page={page}
      pageSize={pageSize}
      statusFilter={statusFilter}
      suggestions={suggestionRows}
    />
  );
}
