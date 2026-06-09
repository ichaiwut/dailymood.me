import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import {
  fetchIapEntitlement,
  applyIapEntitlement,
  isRevenueCatConfigured,
} from "@/lib/revenuecat";
import { getSubscriptionData } from "@/lib/subscription";

// Called by the app immediately after a successful RevenueCat purchase and after a
// "Restore Purchases" that finds an active entitlement, so premium reflects NOW
// instead of waiting on the webhook.
//
// We do NOT trust the request to grant Pro: the user is taken from the Bearer token
// (= RevenueCat appUserID), then the authoritative entitlement is pulled from
// RevenueCat's REST API and applied. Returns the full, updated SubscriptionData.
//
// Body: { platform?: "ios" | "android" } — hint only; RevenueCat is the truth.
export async function POST() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  if (!isRevenueCatConfigured()) {
    // Backend not provisioned yet — JSON, never HTML. App treats it like iap_failed:
    // "purchase received, Pro will activate shortly" and trusts the webhook.
    return NextResponse.json({ error: "iap_failed" }, { status: 503 });
  }

  try {
    // No active entitlement is a normal outcome (applyIapEntitlement leaves the user
    // non-premium / downgrades an expired IAP) — we still return SubscriptionData 200.
    const ent = await fetchIapEntitlement(userId);
    await applyIapEntitlement(userId, ent);
  } catch {
    // Transient RevenueCat / network failure. The client shows a recoverable message
    // and the webhook reconciles when it arrives. JSON body, not a 500 HTML page.
    return NextResponse.json({ error: "iap_failed" }, { status: 502 });
  }

  const data = await getSubscriptionData(userId);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}
