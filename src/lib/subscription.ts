// Single builder for the SubscriptionData shape returned by both
// `GET /api/subscription` and `POST /api/iap/reconcile`, so the two never drift.

import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import type { IapStore } from "@/lib/revenuecat";

export interface SubscriptionData {
  isPremium: boolean;
  hasStripeCustomer: boolean;
  hasIapSubscription: boolean;
  iapSource: IapStore | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  planInterval: string | null;
  subscriptionStatus: string | null;
  memberSince: string;
  trialActivatedAt: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  isTrialing: boolean;
}

/** Returns null when the user row is missing. */
export async function getSubscriptionData(userId: string): Promise<SubscriptionData | null> {
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
      premiumSource: users.premiumSource,
      iapStore: users.iapStore,
      createdAt: users.createdAt,
      trialActivatedAt: users.trialActivatedAt,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  // Backfill a missing Stripe status (legacy rows) from Stripe directly.
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
  // isPremium flag is set (paid via Stripe OR IAP, or admin-comped) OR an active
  // in-app trial.
  const isPremiumFlag = user.isPremium === true;
  const effectivePremium = isPremiumFlag || inAppTrialActive;

  const isIap = isPremiumFlag && user.premiumSource === "iap";

  let trialDaysLeft = 0;
  if (inAppTrialActive) {
    trialDaysLeft = Math.max(1, Math.ceil((user.trialEndsAt!.getTime() - now.getTime()) / 86_400_000));
  }

  return {
    isPremium: effectivePremium,
    hasStripeCustomer: !!user.stripeCustomerId,
    hasIapSubscription: isIap,
    iapSource: isIap ? (user.iapStore as IapStore | null) : null,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    planInterval: user.planInterval ?? null,
    subscriptionStatus: subStatus ?? null,
    memberSince: user.createdAt.toISOString(),
    trialActivatedAt: user.trialActivatedAt?.toISOString() ?? null,
    trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft,
    isTrialing: inAppTrialActive && !isPremiumFlag,
  };
}
