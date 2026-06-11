// Token-based auth for the native mobile app, layered alongside the existing
// NextAuth web cookie (which mobile clients can't use).
//
//   - Access token: short-lived (1h) signed JWT (HS256, AUTH_SECRET). Stateless —
//     verified on every request by getSessionInfo() in src/lib/tier.ts.
//   - Refresh token: long-lived (60d) opaque random string. Only its SHA-256 hash
//     is stored (mobile_refresh_tokens). Each refresh rotates: the presented token
//     is revoked and a fresh pair issued. Replaying a revoked token signals theft,
//     so the whole user's set is revoked.
//
// Google / Apple sign-in verify the provider's identity token against the provider
// JWKS, then upsert the user by email — the same account-by-email mapping the web
// jwt() callback uses, so web Google users land on their existing account.

import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/cf";
import { mobileRefreshTokens, users } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { generateToken } from "@/lib/password";
import { notifyAdmin } from "@/lib/line";

const ACCESS_TTL_SEC = 60 * 60; // 1 hour
const REFRESH_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const ISSUER = "dailymood";
const ACCESS_AUDIENCE = "dailymood-mobile";

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET / NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Access token (stateless JWT)
// ---------------------------------------------------------------------------

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(ACCESS_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secretKey());
}

/** Returns the userId encoded in a valid access token, or null if invalid/expired. */
export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"], // pin: never accept an attacker-chosen alg from the header
      issuer: ISSUER,
      audience: ACCESS_AUDIENCE,
    });
    if (payload.typ !== "access" || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Refresh token (opaque, hashed at rest, rotating)
// ---------------------------------------------------------------------------

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number; // seconds until the access token expires
}

async function issueRefreshToken(userId: string, device: string | null): Promise<string> {
  const raw = generateToken(48);
  const db = getDb();
  await db.insert(mobileRefreshTokens).values({
    id: ulid(),
    userId,
    tokenHash: await sha256Hex(raw),
    device: device?.slice(0, 256) ?? null,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return raw;
}

export async function issueTokenPair(userId: string, device: string | null): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(userId),
    issueRefreshToken(userId, device),
  ]);
  return { accessToken, refreshToken, tokenType: "Bearer", expiresIn: ACCESS_TTL_SEC };
}

export type RotateResult =
  | { ok: true; userId: string; tokens: TokenPair }
  | { ok: false; reason: "invalid" | "expired" };

export async function rotateRefreshToken(raw: string, device: string | null): Promise<RotateResult> {
  const db = getDb();
  const tokenHash = await sha256Hex(raw);
  const [row] = await db
    .select()
    .from(mobileRefreshTokens)
    .where(eq(mobileRefreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) return { ok: false, reason: "invalid" };

  // Replay of an already-revoked token → likely stolen. Burn the whole set.
  if (row.revokedAt) {
    await revokeAllForUser(row.userId);
    return { ok: false, reason: "invalid" };
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  // Atomically claim the token: only one concurrent caller can flip revoked_at away
  // from NULL. If zero rows come back, another request already rotated (or revoked)
  // it between our read and write — treat that as a replay and burn the whole set.
  const now = new Date();
  const claimed = await db
    .update(mobileRefreshTokens)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(mobileRefreshTokens.id, row.id), isNull(mobileRefreshTokens.revokedAt)))
    .returning({ id: mobileRefreshTokens.id });
  if (claimed.length === 0) {
    await revokeAllForUser(row.userId);
    return { ok: false, reason: "invalid" };
  }

  const tokens = await issueTokenPair(row.userId, device);
  return { ok: true, userId: row.userId, tokens };
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const db = getDb();
  const tokenHash = await sha256Hex(raw);
  await db
    .update(mobileRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(mobileRefreshTokens.tokenHash, tokenHash), isNull(mobileRefreshTokens.revokedAt)));
}

export async function revokeAllForUser(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(mobileRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(mobileRefreshTokens.userId, userId), isNull(mobileRefreshTokens.revokedAt)));
}

// ---------------------------------------------------------------------------
// Social sign-in: verify provider identity token, map to our account by email
// ---------------------------------------------------------------------------

export interface ProviderIdentity {
  email: string;
  name: string | null;
  image: string | null;
}

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

/** Accepted `aud` values for Google ID tokens — the native client ids plus the web one. */
function googleAudiences(): string[] {
  // Only the dedicated native/Expo client ids — NOT the web NextAuth client
  // (AUTH_GOOGLE_ID), to keep the accepted-audience set as narrow as possible.
  return [
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID, // Expo proxy / web client, if used
  ].filter((x): x is string => !!x);
}

/** Accepted `aud` values for Apple ID tokens (bundle id and/or services id), comma-separated. */
function appleAudiences(): string[] {
  return (process.env.APPLE_CLIENT_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function verifyGoogleIdToken(idToken: string): Promise<ProviderIdentity | null> {
  const audience = googleAudiences();
  if (audience.length === 0) return null; // not configured
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
    const emailVerified = payload.email_verified === true || payload.email_verified === "true";
    if (!email || !emailVerified) return null;
    return {
      email,
      name: typeof payload.name === "string" ? payload.name : null,
      image: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch {
    return null;
  }
}

export async function verifyAppleIdToken(idToken: string): Promise<ProviderIdentity | null> {
  const audience = appleAudiences();
  if (audience.length === 0) return null; // not configured
  try {
    const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience,
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
    const emailVerified = payload.email_verified === true || payload.email_verified === "true";
    if (!email || !emailVerified) return null;
    // Apple only sends the name on the very first authorization, and not in the
    // identity token — the client forwards it separately, applied by the caller.
    return { email, name: null, image: null };
  } catch {
    return null;
  }
}

export interface MobileUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/** The user fields returned to the mobile client after auth. */
export async function getMobileUser(userId: string): Promise<MobileUser | null> {
  const db = getDb();
  const [u] = await db
    .select({ id: users.id, email: users.email, name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u ?? null;
}

/** Find the user by email or create one (provider vouches for the email). Returns userId. */
export async function upsertUserByEmail(identity: ProviderIdentity, providerLabel: string): Promise<string> {
  const db = getDb();
  const [existing] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, identity.email))
    .limit(1);
  if (existing) {
    // The provider just vouched for this email — back-stamp verification on an
    // existing email+password account that never verified, so it isn't locked
    // into a state where social login works but password login still 403s
    // email_not_verified.
    if (!existing.emailVerified) {
      await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, existing.id));
    }
    return existing.id;
  }

  // Race-safe create: two concurrent first sign-ins for the same email can both pass
  // the read above, so lean on the unique(email) constraint instead. onConflictDoNothing
  // returns the row only when WE inserted it — so notifyAdmin fires exactly once.
  const id = ulid();
  const inserted = await db
    .insert(users)
    .values({
      id,
      email: identity.email,
      name: identity.name,
      image: identity.image,
      emailVerified: new Date(), // OAuth providers vouch for the email
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (inserted.length > 0) {
    notifyAdmin(`🆕 มีคนสมัครใหม่ (${providerLabel})`);
    return inserted[0].id;
  }

  // Lost the race — the other request created it; fetch the now-existing id.
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, identity.email))
    .limit(1);
  return row.id;
}

// Shared handler for native social sign-in (Google / Apple). Verifies the provider
// identity token, maps to our account by email, and returns a token pair + user.
// Rate limiting stays in the route (keyed per provider).
export async function socialLogin(
  provider: "Google" | "Apple",
  body: { idToken?: string; name?: string } | null,
  device: string | null,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const idToken = body?.idToken;
  if (!idToken) return { status: 401, body: { error: "invalid_token" } };

  const identity = provider === "Google"
    ? await verifyGoogleIdToken(idToken)
    : await verifyAppleIdToken(idToken);
  if (!identity) return { status: 401, body: { error: "invalid_token" } };

  // Apple sends the display name only on the first authorization, outside the token.
  if (provider === "Apple" && !identity.name && body?.name) {
    identity.name = body.name.trim() || null;
  }

  const userId = await upsertUserByEmail(identity, provider);
  const [tokens, user] = await Promise.all([issueTokenPair(userId, device), getMobileUser(userId)]);
  if (!user) return { status: 500, body: { error: "server_error" } };
  return { status: 200, body: { ...tokens, user } };
}
