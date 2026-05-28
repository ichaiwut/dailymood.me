import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { aiUsage, users, calendarAiCache, insightsAiCache } from "@/db/schema";
import { sql, gte, eq, desc } from "drizzle-orm";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AiUsageShell } from "@/components/admin/ai-usage-shell";
import { ymdICT } from "@/lib/timezone";
import { A } from "@/components/admin/admin-ui";

function daysAgo(n: number): string {
  return ymdICT(new Date(Date.now() - n * 86400_000));
}

export default async function AdminAiPage() {
  await requireAdmin();
  const db = getDb();

  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  const [
    dailyStats,
    topUsers,
    [{ calendarCacheCount }],
    [{ insightsCacheCount }],
    [totals30d],
    [totals7d],
  ] = await Promise.all([
    db
      .select({
        date: aiUsage.date,
        nlp: sql<number>`sum(${aiUsage.nlpCount})`,
        vision: sql<number>`sum(${aiUsage.visionCount})`,
        tokensIn: sql<number>`coalesce(sum(${aiUsage.tokensIn}), 0)`,
        tokensOut: sql<number>`coalesce(sum(${aiUsage.tokensOut}), 0)`,
        cost: sql<number>`coalesce(sum(${aiUsage.estimatedCostThb}), 0)`,
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
      .groupBy(aiUsage.userId, users.email)
      .orderBy(
        desc(sql`sum(${aiUsage.nlpCount} + ${aiUsage.visionCount})`),
      )
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
        tokensIn: sql<number>`coalesce(sum(${aiUsage.tokensIn}), 0)`,
        tokensOut: sql<number>`coalesce(sum(${aiUsage.tokensOut}), 0)`,
        cost: sql<number>`coalesce(sum(${aiUsage.estimatedCostThb}), 0)`,
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
    tokensIn: r.tokensIn,
    tokensOut: r.tokensOut,
    cost: r.cost,
  }));

  const top = topUsers.map((r) => ({
    userId: r.userId,
    email: r.email ?? "—",
    total: r.total,
  }));

  const totalTokens = Number(totals30d.tokensIn) + Number(totals30d.tokensOut);
  const costStr =
    totals30d.cost > 0 ? `฿${totals30d.cost.toFixed(2)}` : "—";

  return (
    <div>
      <AdminPageHeader
        title="AI Usage & Cost"
        subtitle="ติดตามการใช้งาน Gemini API · เดือนปัจจุบัน"
      />

      <div style={A.statGrid}>
        <AdminStatCard
          label="Tokens เดือนนี้"
          value={
            totalTokens > 1_000_000
              ? `${(totalTokens / 1_000_000).toFixed(1)}M`
              : totalTokens > 1_000
                ? `${(totalTokens / 1_000).toFixed(1)}K`
                : totalTokens || "—"
          }
          sub={`In: ${totals30d.tokensIn.toLocaleString()} · Out: ${totals30d.tokensOut.toLocaleString()}`}
        />
        <AdminStatCard
          label="Cost"
          value={costStr}
          color={totals30d.cost > 0 ? "var(--mint)" : undefined}
        />
        <AdminStatCard
          label="NLP Calls"
          value={totals30d.nlp}
          sub={`7d: ${totals7d.nlp}`}
          color="var(--purple)"
        />
        <AdminStatCard
          label="Vision Calls"
          value={totals30d.vision}
          sub={`7d: ${totals7d.vision}`}
          color="var(--peach)"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <AdminStatCard
          label="Calendar Cache"
          value={calendarCacheCount}
          sub="รายการ"
        />
        <AdminStatCard
          label="Insights Cache"
          value={insightsCacheCount}
          sub="รายการ"
        />
      </div>

      <AiUsageShell daily={daily} topUsers={top} />
    </div>
  );
}
