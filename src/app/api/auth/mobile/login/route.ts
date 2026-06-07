import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { issueTokenPair } from "@/lib/mobile-auth";

// Mobile email/password login. Mirrors the web Credentials authorize() flow
// (rate limit → verify password → require verified email) but returns a Bearer
// token pair instead of setting a session cookie.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; device?: string }
    | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password || password.length > 1024) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // Limit per-IP and per-email (like the web flow): the IP bucket bounds a noisy
  // client, the email bucket bounds distributed credential-stuffing on one account.
  for (const key of [`mlogin:${clientIp(req)}`, `mlogin:email:${email}`]) {
    const rl = await rateLimit({ key, limit: 10, windowSec: 900 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
      );
    }
  }

  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      passwordHash: users.passwordHash,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!u || !u.passwordHash || !(await verifyPassword(password, u.passwordHash))) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  if (!u.emailVerified) {
    return NextResponse.json({ error: "email_not_verified" }, { status: 403 });
  }

  const device = body?.device ?? req.headers.get("user-agent");
  const tokens = await issueTokenPair(u.id, device);
  return NextResponse.json({
    ...tokens,
    user: { id: u.id, email: u.email, name: u.name, image: u.image },
  });
}
