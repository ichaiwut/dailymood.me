import { NextRequest, NextResponse } from "next/server";
import {
  fetchIapEntitlement,
  applyIapEntitlement,
  resolveAppUserId,
  shouldIgnoreEnvironment,
  RevenueCatNotConfiguredError,
} from "@/lib/revenuecat";
import { notifyAdmin } from "@/lib/line";

// RevenueCat server-to-server webhook (INITIAL_PURCHASE, RENEWAL, CANCELLATION,
// EXPIRATION, BILLING_ISSUE, PRODUCT_CHANGE, REFUND, TRANSFER, ...).
//
// Rather than trust the event body, we re-fetch the subscriber from RevenueCat's
// REST API and apply the current truth — so every event type collapses to one code
// path that is idempotent and order-independent by construction (a duplicate,
// retried, or out-of-order event just re-applies the latest state; it can't regress
// premium). That makes an explicit event.id dedup unnecessary.
//
// The grace/refund matrix falls out of this for free:
//   BILLING_ISSUE → entitlement still active during grace ⇒ stays premium
//   EXPIRATION / REFUND → entitlement gone ⇒ premium dropped
//   CANCELLATION (auto-renew off) → entitlement active until period end, willRenew
//     false ⇒ cancelAtPeriodEnd true, premium kept until it actually expires
//
// Auth: RevenueCat echoes a fixed string in the Authorization header (configured in
// the dashboard). It mutates premium state, so — unlike a fail-open captcha — it
// rejects when the secret is unset or mismatched.
export async function POST(req: NextRequest) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) return NextResponse.json({ error: "iap_not_configured" }, { status: 503 });
  if (req.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    event?: { app_user_id?: string; original_app_user_id?: string; aliases?: string[]; type?: string; environment?: string };
  } | null;
  const event = body?.event;
  if (!event) return NextResponse.json({ received: true, ignored: "no_event" });

  // Prod ignores sandbox purchases (staging uses a separate RC project + ALLOW_SANDBOX).
  if (shouldIgnoreEnvironment(event.environment)) {
    return NextResponse.json({ received: true, ignored: "sandbox" });
  }

  // Resolve our user id from app_user_id / aliases (purchases made before logIn carry
  // an anonymous id). Nothing to map ⇒ ack so RevenueCat stops retrying.
  const userId = resolveAppUserId(event);
  if (!userId) return NextResponse.json({ received: true, ignored: "unmapped_app_user_id" });

  try {
    const ent = await fetchIapEntitlement(userId);
    const result = await applyIapEntitlement(userId, ent);
    if (result.becamePremium && event.type === "INITIAL_PURCHASE") {
      notifyAdmin("💳 มีคนสมัคร Pro (ผ่าน App Store / Play)"); // generic, no PII
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof RevenueCatNotConfiguredError) {
      return NextResponse.json({ error: "iap_not_configured" }, { status: 503 });
    }
    // 500 ⇒ RevenueCat retries the delivery later.
    return NextResponse.json({ error: "apply_failed" }, { status: 500 });
  }
}
