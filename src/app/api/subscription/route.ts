import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const [user] = await db
    .select({
      isPremium: users.isPremium,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      currentPeriodEnd: users.currentPeriodEnd,
      cancelAtPeriodEnd: users.cancelAtPeriodEnd,
      planInterval: users.planInterval,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    isPremium: user.isPremium,
    hasStripeCustomer: !!user.stripeCustomerId,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    planInterval: user.planInterval ?? null,
    memberSince: user.createdAt.toISOString(),
  });
}
