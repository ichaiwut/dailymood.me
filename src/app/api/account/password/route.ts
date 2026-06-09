import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";

// Whether the signed-in account already has a password set. Google-only accounts
// have a null password_hash → the client shows "set a password" instead of
// "change password" (and the POST below skips the current-password check).
export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const [u] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ hasPassword: !!u.passwordHash });
}

export async function POST(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  // Per-user throttle so a hijacked session can't brute-force the current password.
  // Keyed by user (not IP) so it follows the account across devices/networks.
  const rl = await rateLimit({ key: `pwchange:${userId}`, limit: 5, windowSec: 900 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    currentPassword?: string;
    newPassword?: string;
  } | null;
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  if (!newPassword || newPassword.length < 8 || newPassword.length > 1024) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Account already has a password → require + verify the current one.
  // Google-only accounts (no hash) skip this: this call *adds* a password.
  if (u.passwordHash) {
    if (!currentPassword) {
      return NextResponse.json({ error: "current_password_required" }, { status: 400 });
    }
    const ok = await verifyPassword(currentPassword, u.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "wrong_current_password" }, { status: 400 });
    }
    // No-op guard: don't let the new password equal the old one.
    if (await verifyPassword(newPassword, u.passwordHash)) {
      return NextResponse.json({ error: "same_password" }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  // hadPassword=false means we just enabled email/password login for a Google account.
  return NextResponse.json({ ok: true, hadPassword: !!u.passwordHash });
}
