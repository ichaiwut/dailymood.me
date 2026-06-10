import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users, verificationTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateToken } from "@/lib/password";
import { sendResetEmail } from "@/lib/auth-email";
import { rateLimit, clientIp } from "@/lib/rate-limit";


const RESET_TTL_MS = 60 * 60 * 1000;

// Always returns ok=true to avoid email enumeration.
export async function POST(req: NextRequest) {
  const rl = await rateLimit({
    key: `forgot:${clientIp(req)}`,
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
    locale?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase();
  const locale = body?.locale === "th" ? "th" : "en";
  if (!email) return NextResponse.json({ ok: true });

  const db = getDb();
  const [u] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Send for every existing account — including Google/Apple-only ones with no
  // password yet. For those, "reset" acts as "set": proving inbox access via the
  // emailed link is the safe way to ADD a password credential (it never detaches
  // the social login). Mobile is email+password only, so this is the only door
  // into the app for users who originally signed up with Google on the web.
  // Unknown emails still get the same silent ok (anti-enumeration).
  if (u) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "password_reset"),
        ),
      );
    const token = generateToken();
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires: new Date(Date.now() + RESET_TTL_MS),
      type: "password_reset",
    });
    await sendResetEmail({ to: email, token, locale });
  }

  return NextResponse.json({ ok: true });
}
