import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";


export async function POST(req: NextRequest) {
  const APP_URL = req.headers.get("origin") || process.env.NEXTAUTH_URL || "https://my.dailymood.me";
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId, premiumSource: users.premiumSource })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  // Enforce: only a Stripe-billed subscription can be managed/cancelled here.
  // An IAP subscriber may carry a leftover stripeCustomerId (old web trial, etc.)
  // — they must cancel in the App Store / Google Play, never via the web portal.
  if (user.premiumSource !== "stripe") {
    return NextResponse.json({ error: "manage_in_store" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${APP_URL}/profile/subscription`,
  });

  return NextResponse.json({ url: session.url });
}
