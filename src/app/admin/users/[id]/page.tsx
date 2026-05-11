import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { users, moodEntries, aiUsage, accounts } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UserDetailShell } from "@/components/admin/user-detail-shell";


export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) redirect("/admin/users");

  const [entries, [{ totalEntries }], [{ totalNlp, totalVision }], userAccounts] =
    await Promise.all([
      db
        .select({
          id: moodEntries.id,
          moodTypeId: moodEntries.moodTypeId,
          aiSource: moodEntries.aiSource,
          date: moodEntries.date,
          createdAt: moodEntries.createdAt,
        })
        .from(moodEntries)
        .where(eq(moodEntries.userId, id))
        .orderBy(desc(moodEntries.createdAt))
        .limit(20),
      db
        .select({ totalEntries: sql<number>`count(*)` })
        .from(moodEntries)
        .where(eq(moodEntries.userId, id)),
      db
        .select({
          totalNlp: sql<number>`coalesce(sum(${aiUsage.nlpCount}), 0)`,
          totalVision: sql<number>`coalesce(sum(${aiUsage.visionCount}), 0)`,
        })
        .from(aiUsage)
        .where(eq(aiUsage.userId, id)),
      db
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(eq(accounts.userId, id)),
    ]);

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    isPremium: user.isPremium,
    planInterval: user.planInterval,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    locale: user.locale,
    bio: user.bio,
    accentColor: user.accentColor,
    createdAt: user.createdAt.toISOString(),
    emailVerified: !!user.emailVerified,
    hasPassword: !!user.passwordHash,
    providers: userAccounts.map((a) => a.provider),
    totalEntries,
    totalNlp,
    totalVision,
  };

  const recentEntries = entries.map((e) => ({
    id: e.id,
    moodTypeId: e.moodTypeId,
    aiSource: e.aiSource,
    date: e.date,
    createdAt: e.createdAt.toISOString(),
  }));

  return <UserDetailShell user={userData} entries={recentEntries} />;
}
