import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { feedbacks, suggestionFeedback, users } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { FeedbackShell } from "@/components/admin/feedback-shell";

export const runtime = "edge";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
  const pageSize = 50;

  const db = getDb();

  const [userFb, [{ totalFeedback }], suggFb] = await Promise.all([
    db
      .select({
        id: feedbacks.id,
        userId: feedbacks.userId,
        email: users.email,
        message: feedbacks.message,
        createdAt: feedbacks.createdAt,
      })
      .from(feedbacks)
      .leftJoin(users, eq(feedbacks.userId, users.id))
      .orderBy(desc(feedbacks.createdAt))
      .limit(pageSize)
      .offset(page * pageSize),
    db.select({ totalFeedback: sql<number>`count(*)` }).from(feedbacks),
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
      page={page}
      pageSize={pageSize}
      suggestions={suggestionRows}
    />
  );
}
