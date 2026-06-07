import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";


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
      subscriptionStatus: users.subscriptionStatus,
      createdAt: users.createdAt,
      trialActivatedAt: users.trialActivatedAt,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let subStatus = user.subscriptionStatus;
  if (!subStatus && user.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      subStatus = sub.status;
      await db.update(users).set({ subscriptionStatus: subStatus }).where(eq(users.id, userId));
    } catch {}
  }

  const now = new Date();
  const inAppTrialActive = !!user.trialEndsAt && user.trialEndsAt.getTime() > now.getTime();
  // Premium definition must match getSessionInfo() in lib/tier.ts: premium if the
  // isPremium flag is set (paid OR admin-granted/comped — no Stripe subscription
  // required) OR an active in-app trial. hasStripeCustomer gates billing UI separately.
  const isPremiumFlag = user.isPremium === true;
  const effectivePremium = isPremiumFlag || inAppTrialActive;

  let trialDaysLeft: number | null = null;
  if (inAppTrialActive) {
    trialDaysLeft = Math.max(1, Math.ceil((user.trialEndsAt!.getTime() - now.getTime()) / 86_400_000));
  }

  return NextResponse.json({
    isPremium: effectivePremium,
    hasStripeCustomer: !!user.stripeCustomerId,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    planInterval: user.planInterval ?? null,
    subscriptionStatus: subStatus ?? null,
    memberSince: user.createdAt.toISOString(),
    trialActivatedAt: user.trialActivatedAt?.toISOString() ?? null,
    trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft,
    isTrialing: inAppTrialActive && !isPremiumFlag,
  });
}
