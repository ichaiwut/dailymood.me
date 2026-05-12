import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ulid } from "@/lib/ulid";
import { hashPassword, generateToken } from "@/lib/password";
import { sendVerifyEmail } from "@/lib/auth-email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notifyAdmin } from "@/lib/line";


const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const rl = await rateLimit({
    key: `register:${clientIp(req)}`,
    limit: 5,
    windowSec: 3600,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
    name?: string;
    locale?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const name = body?.name?.trim();
  const locale = body?.locale === "th" ? "th" : "en";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!password || password.length < 8 || password.length > 1024) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }
  if (!name || name.length < 1) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      {
        error: existing.passwordHash ? "email_taken" : "use_google",
      },
      { status: 409 },
    );
  }

  const id = ulid();
  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    id,
    email,
    name,
    passwordHash,
    locale,
  });

  // clear any stale verify tokens for this email, issue a fresh one
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.type, "email_verify"),
      ),
    );

  const token = generateToken();
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires: new Date(Date.now() + VERIFY_TTL_MS),
    type: "email_verify",
  });

  await sendVerifyEmail({ to: email, token, locale });

  notifyAdmin(`🆕 สมัครใหม่: ${email}`);

  return NextResponse.json({ ok: true });
}
