import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";


// True when Stripe rejected because the customer we passed doesn't exist in the
// current mode — e.g. a customer id saved while the app ran on test keys, now
// used against live keys, or a customer deleted in the dashboard.
function isMissingCustomer(e: unknown): boolean {
  return !!e && typeof e === "object"
    && (e as { code?: string }).code === "resource_missing"
    && (e as { param?: string }).param === "customer";
}

export async function POST(req: NextRequest) {
  const PRICES: Record<string, string | undefined> = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_YEARLY,
  };
  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "https://my.dailymood.me";

  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const plan = body.plan as string;
  const priceId = PRICES[plan];
  if (!priceId) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

  const db = getDb();
  const [user] = await db
    .select({ email: users.email, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const createCustomer = async (): Promise<string> => {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
    await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
    return customer.id;
  };

  const createSession = (customerId: string) =>
    stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/welcome-pro`,
      cancel_url: `${origin}/pricing?cancelled=1`,
      subscription_data: { metadata: { userId } },
      metadata: { userId },
    });

  try {
    let customerId = user.stripeCustomerId ?? (await createCustomer());
    let session;
    try {
      session = await createSession(customerId);
    } catch (e) {
      // Stale/cross-mode customer id — drop it, make a fresh one, retry once.
      if (!isMissingCustomer(e)) throw e;
      customerId = await createCustomer();
      session = await createSession(customerId);
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe checkout failed", e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
