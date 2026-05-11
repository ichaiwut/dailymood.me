import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { feedbacks } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { eq, desc } from "drizzle-orm";


const COOLDOWN_MS = 30 * 60 * 1000;

export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const [last] = await db
    .select({ createdAt: feedbacks.createdAt })
    .from(feedbacks)
    .where(eq(feedbacks.userId, userId))
    .orderBy(desc(feedbacks.createdAt))
    .limit(1);

  if (last) {
    const elapsed = Date.now() - last.createdAt.getTime();
    if (elapsed < COOLDOWN_MS) {
      return NextResponse.json({ cooldown: true, remainMin: Math.ceil((COOLDOWN_MS - elapsed) / 60000) });
    }
  }

  return NextResponse.json({ cooldown: false, remainMin: 0 });
}

export async function POST(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const message = typeof body.message === "string" ? (body.message as string).trim() : "";

  if (!message || message.length > 1000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const db = getDb();

  const [last] = await db
    .select({ createdAt: feedbacks.createdAt })
    .from(feedbacks)
    .where(eq(feedbacks.userId, userId))
    .orderBy(desc(feedbacks.createdAt))
    .limit(1);

  if (last) {
    const elapsed = Date.now() - last.createdAt.getTime();
    if (elapsed < COOLDOWN_MS) {
      const remainMin = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      return NextResponse.json({ error: "cooldown", remainMin }, { status: 429 });
    }
  }

  await db.insert(feedbacks).values({ id: ulid(), userId, message });

  return NextResponse.json({ ok: true });
}
