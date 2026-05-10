import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { suggestionFeedback } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const weekKey = body.weekKey as string | undefined;
  const suggestionTitle = body.suggestionTitle as string | undefined;
  const reaction = body.reaction as string | undefined;

  if (!weekKey || !suggestionTitle || !reaction) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const validReactions = ["up", "down", "routine"] as const;
  if (!(validReactions as readonly string[]).includes(reaction)) {
    return NextResponse.json({ error: "invalid_reaction" }, { status: 400 });
  }
  const typedReaction = reaction as "up" | "down" | "routine";

  const db = getDb();

  const existing = await db
    .select({ id: suggestionFeedback.id })
    .from(suggestionFeedback)
    .where(
      and(
        eq(suggestionFeedback.userId, userId),
        eq(suggestionFeedback.weekKey, weekKey),
        eq(suggestionFeedback.suggestionTitle, suggestionTitle),
        eq(suggestionFeedback.reaction, typedReaction),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ ok: true, existing: true });
  }

  const id = crypto.randomUUID();
  await db.insert(suggestionFeedback).values({
    id,
    userId,
    weekKey,
    suggestionTitle,
    reaction: typedReaction,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
