/**
 * Which methods can sign a given user in.
 *
 * Nothing recorded the provider before this module existed: both the web `jwt`
 * callback and mobile's `upsertUserByEmail()` matched an account by email and
 * threw the rest away, so the NextAuth `accounts` table sat empty. We now write
 * a row on every social sign-in and every link, and *infer* the answer for users
 * who have not signed in since.
 *
 * The inference lives here rather than in the database on purpose. Backfilled
 * rows would be guesses wearing the costume of recorded fact, and a guess that
 * turns out wrong (Apple users look exactly like Google users once you strip the
 * avatar away) would then have to be hunted back out of an auth table. Guessing
 * at read time costs one branch and corrects itself the moment the user returns.
 */
import { getDb } from "@/lib/cf";
import { users, accounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ulid } from "@/lib/ulid";

export type ProviderId = "google" | "apple";

export interface ProviderState {
  linked: true;
  /** true = a row in `accounts`; false = inferred from the evidence below. */
  confirmed: boolean;
}

export interface AuthMethods {
  password: boolean;
  google: ProviderState | null;
  apple: ProviderState | null;
}

/** Google puts every profile photo on this host. */
const GOOGLE_IMAGE_HOST = "googleusercontent.com";
/** Apple's "Hide My Email" relay domain — only Apple issues these. */
const APPLE_RELAY_DOMAIN = "privaterelay.appleid.com";

/** `accounts.type` for a link that is live, versus one the user switched off. */
const LIVE = "oauth";
const UNLINKED = "unlinked";

/**
 * Record that `providerAccountId` on `provider` signs this user in.
 *
 * Re-asserting an existing row revives it, which is what lets a user reconnect a
 * provider they previously disconnected. Callers establish ownership first: the
 * link endpoint rejects an identity held by someone else, and the sign-in path
 * only reaches here with an identity the provider just vouched for.
 */
export async function recordProviderLink(
  userId: string,
  provider: ProviderId,
  providerAccountId: string,
): Promise<void> {
  const db = getDb();
  await db
    .insert(accounts)
    .values({ id: ulid(), userId, type: LIVE, provider, providerAccountId })
    .onConflictDoUpdate({
      target: [accounts.provider, accounts.providerAccountId],
      set: { userId, type: LIVE },
    });
}

/** The user this provider identity already belongs to, if any. */
export async function findUserByProviderAccount(
  provider: ProviderId,
  providerAccountId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
    .limit(1);
  return row?.userId ?? null;
}

/**
 * Switch a link off, keeping the row as a tombstone.
 *
 * Deleting it would be wrong: readAuthMethods() falls back to guessing for users
 * with no rows at all, and the evidence it guesses from outlives the link — a
 * Google avatar stays in `users.image`, an Apple relay address *is* the account
 * email. A deleted row would therefore be inferred straight back, and the
 * provider the user just disconnected would reappear as connected.
 */
export async function removeProviderLink(userId: string, provider: ProviderId): Promise<void> {
  const db = getDb();
  await db
    .update(accounts)
    .set({ type: UNLINKED })
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));
}

/**
 * Refresh the cached provider avatar.
 *
 * Unconditional on purpose: a photo the user uploaded themselves lives in
 * `image_key` and already wins when `/api/profile` picks a URL, so keeping
 * `image` current is free — and if they ever delete their upload they fall back
 * to a photo that still looks like them instead of one from years ago.
 */
export async function refreshProviderImage(userId: string, image: string | null): Promise<void> {
  if (!image) return; // Apple never sends one
  const db = getDb();
  await db.update(users).set({ image }).where(eq(users.id, userId));
}

/**
 * What can sign this user in. Returns null when the user does not exist.
 *
 * Recorded links always win. Only a user with no rows at all falls through to
 * the evidence: a password hash is proof on its own (it is what the login check
 * reads), a Google-hosted avatar could only have come from Google, and an Apple
 * relay address could only have come from Apple. Anything else stays unknown —
 * an Apple user who shared their real address is indistinguishable from a Google
 * user with no profile photo, and naming the wrong brand on the screen is worse
 * than admitting we do not know yet.
 */
export async function readAuthMethods(userId: string): Promise<AuthMethods | null> {
  const db = getDb();

  const [[user], links] = await Promise.all([
    db
      .select({ email: users.email, image: users.image, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({ provider: accounts.provider, type: accounts.type })
      .from(accounts)
      .where(eq(accounts.userId, userId)),
  ]);
  if (!user) return null;

  const password = !!user.passwordHash;

  // Any row at all — live or tombstoned — means this account's providers are on
  // record, so we answer from the rows and never guess. Guessing is only for
  // users we have never observed signing in.
  if (links.length > 0) {
    const live = new Set(links.filter((l) => l.type === LIVE).map((l) => l.provider));
    return {
      password,
      google: live.has("google") ? { linked: true, confirmed: true } : null,
      apple: live.has("apple") ? { linked: true, confirmed: true } : null,
    };
  }

  const inferred: ProviderState = { linked: true, confirmed: false };
  const looksGoogle = (user.image ?? "").includes(GOOGLE_IMAGE_HOST);
  const looksApple = user.email.endsWith(`@${APPLE_RELAY_DOMAIN}`);

  return {
    password,
    google: looksGoogle ? inferred : null,
    apple: looksApple ? inferred : null,
  };
}

/** Can this user still get in after `dropping` is removed? */
export function hasAnotherWayIn(methods: AuthMethods, dropping: ProviderId): boolean {
  if (methods.password) return true;
  const other: ProviderId = dropping === "google" ? "apple" : "google";
  return methods[other] !== null;
}
