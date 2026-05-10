import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        const item = sub.items.data[0];
        const interval = item?.price?.recurring?.interval ?? null;
        const periodEnd = item?.current_period_end;
        const customerId = typeof session.customer === "string"
          ? session.customer
          : (session.customer?.id ?? null);
        await db.update(users).set({
          isPremium: true,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subId,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          planInterval: interval,
          subscriptionStatus: sub.status,
        }).where(eq(users.id, userId));
      }
      break;
    }

    case "customer.subscription.updated": {
      const rawSub = event.data.object;
      const userId = rawSub.metadata?.userId;
      if (userId) {
        const sub = await stripe.subscriptions.retrieve(rawSub.id);
        const active = sub.status === "active" || sub.status === "trialing";
        const item = sub.items.data[0];
        const interval = item?.price?.recurring?.interval ?? null;
        const periodEnd = item?.current_period_end;
        await db.update(users).set({
          isPremium: active,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          planInterval: interval,
          subscriptionStatus: sub.status,
        }).where(eq(users.id, userId));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      if (userId) {
        await db.update(users).set({
          isPremium: false,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          planInterval: null,
          subscriptionStatus: null,
        }).where(eq(users.id, userId));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
