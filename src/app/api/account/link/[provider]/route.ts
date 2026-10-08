/**
 * Connect or disconnect a Google / Apple account for the signed-in user.
 *
 * POST takes the identity token the native sign-in already produced, so the app
 * reuses the exact flow it uses to log in — it just hands the token here instead
 * of to /api/auth/mobile/*.
 *
 * The provider's email must equal the account's. Our whole login path resolves a
 * user by email (`upsertUserByEmail`, and the web `jwt` callback), so a link
 * across two different addresses would come apart on the next sign-in: the
 * lookup would miss and quietly create a second account holding none of the
 * user's entries.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { verifyGoogleIdToken, verifyAppleIdToken } from "@/lib/mobile-auth";
import {
  readAuthMethods,
  recordProviderLink,
  removeProviderLink,
  refreshProviderImage,
  findUserByProviderAccount,
  hasAnotherWayIn,
  type ProviderId,
} from "@/lib/auth-providers";

function parseProvider(raw: string): ProviderId | null {
  return raw === "google" || raw === "apple" ? raw : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const provider = parseProvider((await params).provider);
  if (!provider) return NextResponse.json({ error: "unknown_provider" }, { status: 404 });

  // Keyed by user, not IP, so it follows the account across devices.
  const rl = await rateLimit({ key: `link:${userId}`, limit: 10, windowSec: 900 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const body = (await req.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  const identity =
    provider === "google"
      ? await verifyGoogleIdToken(body.idToken)
      : await verifyAppleIdToken(body.idToken);
  if (!identity) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

  const db = getDb();
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (identity.email !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 409 });
  }

  // Already bound elsewhere → say so rather than moving it. Two accounts sharing
  // one provider identity would make the next sign-in's winner arbitrary.
  const owner = await findUserByProviderAccount(provider, identity.sub);
  if (owner && owner !== userId) {
    return NextResponse.json({ error: "already_linked" }, { status: 409 });
  }

  await recordProviderLink(userId, provider, identity.sub);
  await refreshProviderImage(userId, identity.image);

  const auth = await readAuthMethods(userId);
  return NextResponse.json({ ok: true, auth });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const provider = parseProvider((await params).provider);
  if (!provider) return NextResponse.json({ error: "unknown_provider" }, { status: 404 });

  const methods = await readAuthMethods(userId);
  if (!methods) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Refuse to leave the account with no way back in. The client turns this into
  // an invitation to set a password first.
  if (!hasAnotherWayIn(methods, provider)) {
    return NextResponse.json({ error: "last_sign_in_method" }, { status: 409 });
  }

  await removeProviderLink(userId, provider);

  const auth = await readAuthMethods(userId);
  return NextResponse.json({ ok: true, auth });
}
