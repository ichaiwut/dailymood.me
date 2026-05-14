import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { askAiThreads, askAiMessages } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const db = getDb();

  try {
    const threads = await db
      .select({
        id: askAiThreads.id,
        title: askAiThreads.title,
        createdAt: askAiThreads.createdAt,
        lastMessageAt: askAiThreads.lastMessageAt,
      })
      .from(askAiThreads)
      .where(eq(askAiThreads.userId, userId))
      .orderBy(desc(askAiThreads.lastMessageAt))
      .limit(50);

    return NextResponse.json({ threads });
  } catch {
    return NextResponse.json({ threads: [] });
  }
}

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const body = (await req.json()) as { title?: string };
  const title = (body.title ?? "").trim().slice(0, 100) || "คำถามใหม่";
  const id = randomUUID();

  const db = getDb();

  try {
    await db.insert(askAiThreads).values({
      id,
      userId,
      title,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    });
  } catch {
    return NextResponse.json({ id, title });
  }

  return NextResponse.json({ id, title });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("id");
  if (!threadId) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const db = getDb();

  try {
    await db.delete(askAiMessages).where(eq(askAiMessages.threadId, threadId));
    await db.delete(askAiThreads).where(and(eq(askAiThreads.id, threadId), eq(askAiThreads.userId, userId)));
  } catch {
    // table may not exist yet
  }

  return NextResponse.json({ ok: true });
}
