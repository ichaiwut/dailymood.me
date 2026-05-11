import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";


// Tells the email-first login UI which path to show:
// - { exists: false }                       → show register form
// - { exists: true, hasPassword: true }     → show password input
// - { exists: true, hasPassword: false }    → user signed up via Google (no pwd) → show "use Google"
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!u) return NextResponse.json({ exists: false });
  return NextResponse.json({ exists: true, hasPassword: !!u.passwordHash });
}
