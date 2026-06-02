import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless one-click unsubscribe tokens for marketing email.
 *
 * We sign the userId with an HMAC so the unsubscribe link needs no DB-stored
 * token. Uses UNSUBSCRIBE_SECRET, falling back to the NextAuth secret so local
 * dev works without extra env. Set UNSUBSCRIBE_SECRET in prod (Railway).
 */
function secret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-unsubscribe-secret"
  );
}

export function signUnsub(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("base64url");
}

export function verifyUnsub(userId: string, sig: string): boolean {
  if (!userId || !sig) return false;
  const expected = signUnsub(userId);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const APP_URL = process.env.NEXTAUTH_URL || "https://my.dailymood.me";

/** Full one-click unsubscribe URL for a given user. */
export function unsubUrl(userId: string): string {
  const sig = signUnsub(userId);
  return `${APP_URL}/api/unsubscribe?u=${encodeURIComponent(userId)}&sig=${sig}`;
}
