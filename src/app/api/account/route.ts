import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users, moodEntries, verificationTokens } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { deleteObject } from "@/lib/r2";
import { stripe } from "@/lib/stripe";
import { notifyAdmin } from "@/lib/line";

// Permanent account deletion (Play / App Store requirement).
//
// Every user-owned table has ON DELETE CASCADE on its users.id FK, so one
// `DELETE FROM users` removes entries, mood types, events, device tokens,
// refresh tokens, AI caches, feedback, achievements, bookmarks, etc.
// Three things live outside that cascade and are handled explicitly:
//   - verification_tokens (keyed by email, no FK)
//   - R2 images (profile + entry photos)
//   - an active Stripe subscription, which must be cancelled so a deleted
//     account can't keep billing. IAP subs can't be cancelled server-side —
//     the user cancels those in the store themselves; we just drop our rows.
//
// Mobile access tokens are stateless JWTs: the cascade kills the refresh
// token immediately, the access token dies at its short expiry. The app
// signs out right after calling this, so neither is ever used again.
export async function DELETE() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const [user] = await db
    .select({
      email: users.email,
      imageKey: users.imageKey,
      stripeSubscriptionId: users.stripeSubscriptionId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Cancel Stripe billing first, while we still hold the subscription id.
  // Deletion proceeds even if this fails (the user's right to delete wins);
  // the id is logged so the orphaned subscription can be cancelled manually.
  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (e) {
      console.error(`account-delete: stripe cancel failed for ${user.stripeSubscriptionId}`, e);
    }
  }

  // Collect R2 keys before the cascade wipes the rows that hold them.
  const entryImages = await db
    .select({ key: moodEntries.imageKey })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), isNotNull(moodEntries.imageKey)));
  const imageKeys = [user.imageKey, ...entryImages.map((r) => r.key)]
    .filter((k): k is string => !!k);

  // DB rows go first: if R2 cleanup fails afterwards the orphaned objects are
  // unreachable (signed-URL only) — the reverse order could lose images while
  // the account survives.
  await db.delete(users).where(eq(users.id, userId));
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, user.email));

  for (const key of imageKeys) {
    try {
      await deleteObject(key);
    } catch {
      // best-effort — account is already gone
    }
  }

  notifyAdmin("🗑️ มีคนลบบัญชี"); // generic, no PII
  return NextResponse.json({ ok: true });
}
