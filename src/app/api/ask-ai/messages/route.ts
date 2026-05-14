import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { askAiMessages, askAiThreads, moodEntries } from "@/db/schema";
import { and, eq, gte, desc, asc } from "drizzle-orm";
import { generateChatResponse } from "@/lib/gemini";
import { moodScore, ymd, addDays } from "@/lib/mood-scores";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const threadId = new URL(req.url).searchParams.get("threadId");
  if (!threadId) return NextResponse.json({ error: "missing_threadId" }, { status: 400 });

  const db = getDb();

  try {
    const messages = await db
      .select({
        id: askAiMessages.id,
        role: askAiMessages.role,
        content: askAiMessages.content,
        sourcesJson: askAiMessages.sourcesJson,
        feedback: askAiMessages.feedback,
        createdAt: askAiMessages.createdAt,
      })
      .from(askAiMessages)
      .where(eq(askAiMessages.threadId, threadId))
      .orderBy(asc(askAiMessages.createdAt))
      .limit(100);

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  const body = (await req.json()) as { threadId: string; content: string; locale?: string };
  const { threadId, content } = body;
  const locale = body.locale ?? "th";

  if (!threadId || !content || content.trim().length === 0) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const db = getDb();

  // Save user message
  const userMsgId = randomUUID();
  try {
    await db.insert(askAiMessages).values({
      id: userMsgId,
      threadId,
      role: "user",
      content: content.trim(),
      createdAt: new Date(),
    });
  } catch {
    // table may not exist
  }

  // Get conversation history
  let history: { role: string; content: string }[] = [];
  try {
    const prev = await db
      .select({ role: askAiMessages.role, content: askAiMessages.content })
      .from(askAiMessages)
      .where(eq(askAiMessages.threadId, threadId))
      .orderBy(desc(askAiMessages.createdAt))
      .limit(10);
    history = prev.reverse().slice(-6);
  } catch {
    // table may not exist
  }

  // Fetch mood data (60 days)
  const start = ymd(addDays(new Date(), -59));
  const entries = await db
    .select({
      date: moodEntries.date,
      moodTypeId: moodEntries.moodTypeId,
      note: moodEntries.note,
      tags: moodEntries.tags,
      sentiment: moodEntries.sentiment,
    })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(100);

  const moodData = entries.map((e) => ({
    d: e.date,
    m: e.moodTypeId,
    s: moodScore(e.moodTypeId),
    n: e.note?.slice(0, 60) ?? null,
    tags: e.tags,
  }));

  const tagCounts: Record<string, number> = {};
  for (const e of entries) {
    for (const t of (e.tags as string[] | null) ?? []) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, c]) => `${t}:${c}`);

  const payload = JSON.stringify({
    locale,
    question: content.trim(),
    history: history.map((m) => ({ role: m.role, text: m.content.slice(0, 200) })),
    entries: moodData.slice(0, 40),
    topTags,
    n: entries.length,
  });

  const result = await generateChatResponse(payload);

  // Save AI response
  const aiMsgId = randomUUID();
  try {
    await db.insert(askAiMessages).values({
      id: aiMsgId,
      threadId,
      role: "ai",
      content: result.answer,
      sourcesJson: result.sources,
      createdAt: new Date(),
    });

    // Update thread title (use first question) + lastMessageAt
    await db
      .update(askAiThreads)
      .set({
        title: content.trim().slice(0, 80),
        lastMessageAt: new Date(),
      })
      .where(eq(askAiThreads.id, threadId));
  } catch {
    // table may not exist
  }

  return NextResponse.json({
    userMessage: { id: userMsgId, role: "user", content: content.trim(), createdAt: new Date().toISOString() },
    aiMessage: {
      id: aiMsgId,
      role: "ai",
      content: result.answer,
      sourcesJson: result.sources,
      entriesUsed: result.entriesUsed,
      createdAt: new Date().toISOString(),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as { messageId: string; feedback: "up" | "down" };
  if (!body.messageId || !body.feedback) return NextResponse.json({ error: "missing" }, { status: 400 });

  const db = getDb();
  try {
    await db.update(askAiMessages).set({ feedback: body.feedback }).where(eq(askAiMessages.id, body.messageId));
  } catch {
    // table may not exist
  }

  return NextResponse.json({ ok: true });
}
