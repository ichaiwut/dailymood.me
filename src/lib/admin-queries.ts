import { getDb } from "@/lib/cf";
import { users, moodEntries, feedbacks, aiUsage } from "@/db/schema";
import { sql, gte, eq, desc } from "drizzle-orm";
import { todayICT, ymdICT, nowICT } from "@/lib/timezone";

function daysAgo(n: number): string {
  return ymdICT(new Date(Date.now() - n * 86400_000));
}

export interface OverviewStats {
  totalUsers: number;
  premiumUsers: number;
  totalEntries: number;
  entries7d: number;
  newUsers7d: number;
  newUsers30d: number;
  aiTodayNlp: number;
  aiTodayVision: number;
  totalNlp30d: number;
  totalVision30d: number;
  totalTokensIn30d: number;
  totalTokensOut30d: number;
  totalCost30d: number;
  pendingFeedback: number;
  totalFeedback: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const db = getDb();
  const today = todayICT();
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  const [
    [{ total: totalUsers }],
    [{ total: premiumUsers }],
    [{ total: totalEntries }],
    [{ total: entries7d }],
    [{ total: newUsers7d }],
    [{ total: newUsers30d }],
    [{ nlp: aiTodayNlp, vision: aiTodayVision }],
    [{ nlp: totalNlp30d, vision: totalVision30d, tokIn: totalTokensIn30d, tokOut: totalTokensOut30d, cost: totalCost30d }],
    [{ total: pendingFeedback }],
    [{ total: totalFeedback }],
  ] = await Promise.all([
    db.select({ total: sql<number>`count(*)` }).from(users),
    db.select({ total: sql<number>`count(*)` }).from(users).where(eq(users.isPremium, true)),
    db.select({ total: sql<number>`count(*)` }).from(moodEntries),
    db.select({ total: sql<number>`count(*)` }).from(moodEntries).where(gte(moodEntries.date, d7)),
    db.select({ total: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, new Date(d7))),
    db.select({ total: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, new Date(d30))),
    db
      .select({
        nlp: sql<number>`coalesce(sum(${aiUsage.nlpCount}), 0)`,
        vision: sql<number>`coalesce(sum(${aiUsage.visionCount}), 0)`,
      })
      .from(aiUsage)
      .where(eq(aiUsage.date, today)),
    db
      .select({
        nlp: sql<number>`coalesce(sum(${aiUsage.nlpCount}), 0)`,
        vision: sql<number>`coalesce(sum(${aiUsage.visionCount}), 0)`,
        tokIn: sql<number>`coalesce(sum(${aiUsage.tokensIn}), 0)`,
        tokOut: sql<number>`coalesce(sum(${aiUsage.tokensOut}), 0)`,
        cost: sql<number>`coalesce(sum(${aiUsage.estimatedCostThb}), 0)`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.date, d30)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(feedbacks)
      .where(eq(feedbacks.status, "pending")),
    db.select({ total: sql<number>`count(*)` }).from(feedbacks),
  ]);

  return {
    totalUsers,
    premiumUsers,
    totalEntries,
    entries7d,
    newUsers7d,
    newUsers30d,
    aiTodayNlp,
    aiTodayVision,
    totalNlp30d,
    totalVision30d,
    totalTokensIn30d,
    totalTokensOut30d,
    totalCost30d,
    pendingFeedback,
    totalFeedback,
  };
}

export interface DauRow {
  date: string;
  dau: number;
}

export async function getDauApproximation(days: number): Promise<DauRow[]> {
  const db = getDb();
  const since = daysAgo(days);

  const rows = await db
    .select({
      date: moodEntries.date,
      dau: sql<number>`count(distinct ${moodEntries.userId})`,
    })
    .from(moodEntries)
    .where(gte(moodEntries.date, since))
    .groupBy(moodEntries.date)
    .orderBy(moodEntries.date);

  return rows;
}

export type UserPlan = "free" | "premium" | "trial";

export interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: UserPlan;
  entryCount: number;
  createdAt: string;
}

export async function getRecentUsers(limit = 5): Promise<RecentUser[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      isPremium: users.isPremium,
      trialEndsAt: users.trialEndsAt,
      // NB: `${users.id}` renders unqualified as "id", which collides with
      // mood_entries.id inside the subquery (count always 0). Qualify the
      // outer column explicitly and alias the inner table.
      entryCount: sql<number>`(SELECT count(*) FROM mood_entries me WHERE me.user_id = "users"."id")`,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  const now = Date.now();
  return rows.map((r) => {
    const plan: UserPlan = r.isPremium
      ? "premium"
      : r.trialEndsAt && r.trialEndsAt.getTime() > now
        ? "trial"
        : "free";
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      image: r.image,
      plan,
      entryCount: Number(r.entryCount),
      createdAt: r.createdAt.toISOString(),
    };
  });
}

export interface StripeRevenue {
  amountThb: number;
  chargeCount: number;
  hasData: boolean;
}

export async function getStripeRevenueMTD(): Promise<StripeRevenue> {
  try {
    const { stripe } = await import("@/lib/stripe");
    const ict = nowICT();
    const startOfMonthICT = new Date(
      Date.UTC(ict.getUTCFullYear(), ict.getUTCMonth(), 1) - 7 * 3600_000,
    );
    const gte = Math.floor(startOfMonthICT.getTime() / 1000);

    const charges = await stripe.charges.list({
      limit: 100,
      created: { gte },
    });

    let total = 0;
    let count = 0;
    for (const charge of charges.data) {
      if (charge.status === "succeeded") {
        total += charge.amount;
        count++;
      }
    }

    return { amountThb: total / 100, chargeCount: count, hasData: true };
  } catch {
    return { amountThb: 0, chargeCount: 0, hasData: false };
  }
}
