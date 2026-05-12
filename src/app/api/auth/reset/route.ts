import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users, verificationTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";


export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    token?: string;
    password?: string;
  } | null;
  const token = body?.token;
  const password = body?.password;

  if (!token) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  if (!password || password.length < 8 || password.length > 1024) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, "password_reset"),
      ),
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  if (row.expires.getTime() < Date.now()) {
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  // Resetting password also implicitly verifies the email (proof of inbox access).
  await db
    .update(users)
    .set({ passwordHash, emailVerified: new Date() })
    .where(eq(users.email, row.identifier));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return NextResponse.json({ ok: true });
}
