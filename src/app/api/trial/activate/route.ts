import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notifyAdmin } from "@/lib/line";

const TRIAL_DAYS = 14;

export async function POST(req: NextRequest) {
  const rl = await rateLimit({ key: `trial:${clientIp(req)}`, limit: 5, windowSec: 3600 });
  if (!rl.ok) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const rlUser = await rateLimit({ key: `trial-user:${userId}`, limit: 3, windowSec: 3600 });
  if (!rlUser.ok) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const rows = await getDb()
    .update(users)
    .set({ trialActivatedAt: now, trialEndsAt })
    .where(and(eq(users.id, userId), isNull(users.trialActivatedAt)))
    .returning({ id: users.id });

  if (rows.length === 0) {
    return NextResponse.json({ error: "already_activated" }, { status: 409 });
  }

  notifyAdmin(`🎁 มีคนเปิดใช้ทดลอง Pro 14 วัน`);

  return NextResponse.json({ ok: true, trialEndsAt: trialEndsAt.toISOString() });
}
