import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { aiUsage, users, calendarAiCache, insightsAiCache } from "@/db/schema";
import { sql, gte, eq, desc } from "drizzle-orm";
import { StatCard } from "@/components/admin/stat-card";
import { AiUsageShell } from "@/components/admin/ai-usage-shell";


function dates() {
  const now = Date.now();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return {
    d7: ymd(new Date(now - 7 * 86400_000)),
    d30: ymd(new Date(now - 30 * 86400_000)),
  };
}

export default async function AdminAiPage() {
  await requireAdmin();
  const db = getDb();

  const { d30, d7 } = dates();

  const [dailyStats, topUsers, [{ calendarCacheCount }], [{ insightsCacheCount }], [totals30d], [totals7d]] =
    await Promise.all([
      db
        .select({
          date: aiUsage.date,
          nlp: sql<number>`sum(${aiUsage.nlpCount})`,
          vision: sql<number>`sum(${aiUsage.visionCount})`,
        })
        .from(aiUsage)
        .where(gte(aiUsage.date, d30))
        .groupBy(aiUsage.date)
        .orderBy(aiUsage.date),
      db
        .select({
          userId: aiUsage.userId,
          email: users.email,
          total: sql<number>`sum(${aiUsage.nlpCount} + ${aiUsage.visionCount})`,
        })
        .from(aiUsage)
        .leftJoin(users, eq(aiUsage.userId, users.id))
        .where(gte(aiUsage.date, d30))
        .groupBy(aiUsage.userId)
        .orderBy(desc(sql`sum(${aiUsage.nlpCount} + ${aiUsage.visionCount})`))
        .limit(10),
      db
        .select({ calendarCacheCount: sql<number>`count(*)` })
        .from(calendarAiCache),
      db
        .select({ insightsCacheCount: sql<number>`count(*)` })
        .from(insightsAiCache),
      db
        .select({
          nlp: sql<number>`coalesce(sum(${aiUsage.nlpCount}), 0)`,
          vision: sql<number>`coalesce(sum(${aiUsage.visionCount}), 0)`,
        })
        .from(aiUsage)
        .where(gte(aiUsage.date, d30)),
      db
        .select({
          nlp: sql<number>`coalesce(sum(${aiUsage.nlpCount}), 0)`,
          vision: sql<number>`coalesce(sum(${aiUsage.visionCount}), 0)`,
        })
        .from(aiUsage)
        .where(gte(aiUsage.date, d7)),
    ]);

  const daily = dailyStats.map((r) => ({
    date: r.date,
    nlp: r.nlp,
    vision: r.vision,
  }));

  const top = topUsers.map((r) => ({
    userId: r.userId,
    email: r.email ?? "—",
    total: r.total,
  }));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>การใช้ AI</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="NLP 30 วัน" value={totals30d.nlp} color="var(--purple)" />
        <StatCard label="Vision 30 วัน" value={totals30d.vision} color="var(--peach)" />
        <StatCard label="NLP 7 วัน" value={totals7d.nlp} />
        <StatCard label="Vision 7 วัน" value={totals7d.vision} />
        <StatCard label="Calendar Cache" value={calendarCacheCount} sub="รายการ" />
        <StatCard label="Insights Cache" value={insightsCacheCount} sub="รายการ" />
      </div>

      <AiUsageShell daily={daily} topUsers={top} />
    </div>
  );
}
