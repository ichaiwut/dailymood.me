import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users, verificationTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";


export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token;
  if (!token) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  const db = getDb();
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, "email_verify"),
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

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, row.identifier));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return NextResponse.json({ ok: true });
}
