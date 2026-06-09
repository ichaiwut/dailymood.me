// RevenueCat (in-app purchase) integration.
//
// Native iOS/Android cannot sell digital subscriptions through Stripe (store
// rules), so the mobile app buys via RevenueCat and the server reconciles the
// entitlement out-of-band — either pulled on demand (`/api/iap/reconcile`) or
// pushed by RevenueCat (`/api/webhooks/revenuecat`). Both paths funnel through
// `applyIapEntitlement()` so the grant/downgrade rules live in exactly one place.
//
// We never trust the device or the webhook body to grant Pro: every path re-reads
// the authoritative entitlement from RevenueCat's REST API. That also makes the
// webhook idempotent and order-independent by construction — a stale or duplicate
// event just re-applies current truth, so state can never regress.
//
// Contract with mobile: RevenueCat `appUserID` MUST equal our internal user id
// (the app calls `Purchases.logIn(userId)` after auth). REST lookups resolve
// aliases server-side; the webhook resolves them from event.aliases (below).
//
// Env (Railway prod only — unset locally ⇒ endpoints report not_configured):
//   REVENUECAT_SECRET_KEY      v1 REST secret key (sk_...)
//   REVENUECAT_WEBHOOK_AUTH    shared secret echoed in the webhook Authorization header
//   REVENUECAT_ENTITLEMENT_ID  entitlement identifier (default "pro")
//   REVENUECAT_ALLOW_SANDBOX   "1" on staging to accept SANDBOX events (prod ignores them)

import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const RC_API = "https://api.revenuecat.com/v1";

export function isRevenueCatConfigured(): boolean {
  return !!process.env.REVENUECAT_SECRET_KEY;
}

function entitlementId(): string {
  return process.env.REVENUECAT_ENTITLEMENT_ID || "pro";
}

export type IapStore = "apple" | "google";

/** Map RevenueCat's `store` to the store the user manages the sub in. */
function normalizeStore(store: string | null | undefined): IapStore | null {
  if (store === "app_store" || store === "mac_app_store") return "apple";
  if (store === "play_store") return "google";
  return null;
}

/** Normalized view of the user's "pro" entitlement, store-agnostic. */
export interface IapEntitlement {
  active: boolean;
  expiresAt: Date | null;
  productId: string | null;
  store: IapStore | null;
  /** false when the user turned off auto-renew (RC `unsubscribe_detected_at`). */
  willRenew: boolean;
  /** best-effort "month" | "year" inferred from the product id (RC v1 doesn't expose it cleanly). */
  interval: string | null;
}

interface RcSubscriberResponse {
  subscriber?: {
    entitlements?: Record<string, { expires_date: string | null; product_identifier?: string }>;
    subscriptions?: Record<string, {
      expires_date: string | null;
      store?: string;
      unsubscribe_detected_at?: string | null;
      period_type?: string;
    }>;
  };
}

/** Thrown when RevenueCat env is missing — callers map this to a 503. */
export class RevenueCatNotConfiguredError extends Error {
  constructor() {
    super("revenuecat_not_configured");
    this.name = "RevenueCatNotConfiguredError";
  }
}

function inferInterval(productId: string | null): string | null {
  if (!productId) return null;
  const p = productId.toLowerCase();
  if (/(year|annual|yr|12m)/.test(p)) return "year";
  if (/(month|mo|1m)/.test(p)) return "month";
  return null;
}

const EMPTY: IapEntitlement = { active: false, expiresAt: null, productId: null, store: null, willRenew: false, interval: null };

/**
 * Fetch the authoritative entitlement state for an app user from RevenueCat's
 * REST API. RC resolves anonymous→identified aliases server-side, so any alias of
 * the user maps to the same subscriber.
 */
export async function fetchIapEntitlement(appUserId: string): Promise<IapEntitlement> {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) throw new RevenueCatNotConfiguredError();

  const res = await fetch(`${RC_API}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });

  // 404 = RevenueCat has never seen this app user ⇒ no entitlement (not an error).
  if (res.status === 404) return EMPTY;
  if (!res.ok) throw new Error(`revenuecat_http_${res.status}`);

  const data = (await res.json()) as RcSubscriberResponse;
  const ent = data.subscriber?.entitlements?.[entitlementId()];
  if (!ent) return EMPTY;

  // expires_date null = lifetime/non-expiring entitlement.
  const expiresAt = ent.expires_date ? new Date(ent.expires_date) : null;
  const active = expiresAt === null || expiresAt.getTime() > Date.now();
  const productId = ent.product_identifier ?? null;
  const sub = productId ? data.subscriber?.subscriptions?.[productId] : undefined;

  return {
    active,
    expiresAt,
    productId,
    store: normalizeStore(sub?.store),
    // cancelAtPeriodEnd is derived from this: a billing issue is NOT a cancel
    // (the entitlement stays active through grace), so only unsubscribe matters.
    willRenew: !sub?.unsubscribe_detected_at,
    interval: inferInterval(productId),
  };
}

export interface IapApplyResult {
  isPremium: boolean;
  /** true when this call flipped a non-premium user to premium (used to notify admin once). */
  becamePremium: boolean;
}

/**
 * Apply an entitlement to a user. Single source of truth for both reconcile and
 * webhook.
 *
 * Grant: active entitlement ⇒ premium, premiumSource="iap", iapStore set.
 * Downgrade: an inactive entitlement ONLY clears premium when the user's current
 * source is "iap". A Stripe / trial / comped user (source "stripe" or null) is
 * left untouched, so an IAP miss can never strip web-purchased premium.
 */
export async function applyIapEntitlement(userId: string, ent: IapEntitlement): Promise<IapApplyResult> {
  const db = getDb();
  const [current] = await db
    .select({ isPremium: users.isPremium, premiumSource: users.premiumSource })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!current) return { isPremium: false, becamePremium: false };

  if (ent.active) {
    const becamePremium = !current.isPremium;
    await db.update(users).set({
      isPremium: true,
      premiumSource: "iap",
      iapStore: ent.store,
      currentPeriodEnd: ent.expiresAt,
      cancelAtPeriodEnd: !ent.willRenew,
      planInterval: ent.interval,
      subscriptionStatus: "active",
    }).where(eq(users.id, userId));
    return { isPremium: true, becamePremium };
  }

  // Inactive entitlement: only this user's IAP-granted premium may be revoked.
  if (current.premiumSource === "iap") {
    await db.update(users).set({
      isPremium: false,
      premiumSource: null,
      iapStore: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      planInterval: null,
      subscriptionStatus: "expired",
    }).where(eq(users.id, userId));
    return { isPremium: false, becamePremium: false };
  }

  // Premium came from elsewhere (Stripe / trial / comp) — leave it alone.
  return { isPremium: current.isPremium, becamePremium: false };
}

/**
 * Resolve our DailyMood user id from a RevenueCat webhook event. The event's
 * `app_user_id` is normally our id, but for a purchase that began before
 * `Purchases.logIn` it can be an anonymous id with the real id in `aliases`.
 * Returns null when nothing maps (we ack-and-ignore those).
 */
export function resolveAppUserId(event: { app_user_id?: string; original_app_user_id?: string; aliases?: string[] }): string | null {
  const candidates = [event.app_user_id, ...(event.aliases ?? []), event.original_app_user_id];
  for (const c of candidates) {
    if (c && !c.startsWith("$RCAnonymousID")) return c;
  }
  return null;
}

/** Prod ignores SANDBOX events; staging sets REVENUECAT_ALLOW_SANDBOX=1 to accept them. */
export function shouldIgnoreEnvironment(environment: string | undefined): boolean {
  if (environment === "SANDBOX" && process.env.REVENUECAT_ALLOW_SANDBOX !== "1") return true;
  return false;
}
