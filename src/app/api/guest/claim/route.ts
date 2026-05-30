import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { guestEntries, moodEntries, moodTypes } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { todayKey } from "@/lib/usage";
import { and, eq, isNull, or } from "drizzle-orm";

// Redeems a parked guest analysis (created by /api/guest/analyze) into the
// logged-in user's first real mood entry. Same-origin, requires a session.
export async function POST(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) return NextResponse.json({ error: "token_required" }, { status: 400 });
  // Tokens are ULIDs (Crockford base32). Reject anything else before touching the DB.
  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const db = getDb();
  const [guest] = await db
    .select()
    .from(guestEntries)
    .where(eq(guestEntries.token, token))
    .limit(1);

  if (!guest) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (guest.claimedAt) return NextResponse.json({ ok: true, alreadyClaimed: true });
  if (guest.expiresAt < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  // Guest moods are always system defaults, but validate defensively.
  const [mt] = await db
    .select({ id: moodTypes.id })
    .from(moodTypes)
    .where(
      and(
        eq(moodTypes.id, guest.moodTypeId),
        or(isNull(moodTypes.userId), eq(moodTypes.userId, userId)),
      ),
    )
    .limit(1);
  if (!mt) return NextResponse.json({ error: "invalid_mood" }, { status: 400 });

  // Mark-claimed and insert-entry must be atomic: if the insert fails, the token
  // must NOT stay marked claimed (otherwise it's burned with nothing to show).
  // The conditional UPDATE also wins the race against a concurrent claim.
  const id = ulid();
  let alreadyClaimed = false;
  await db.transaction(async (tx) => {
    const claimed = await tx
      .update(guestEntries)
      .set({ claimedAt: new Date() })
      .where(and(eq(guestEntries.token, token), isNull(guestEntries.claimedAt)))
      .returning({ token: guestEntries.token });
    if (claimed.length === 0) {
      alreadyClaimed = true;
      return;
    }
    // This handoff redeems into the user's FIRST entry only. If they already have
    // entries (returning user, or a second token), consume the token without
    // inserting a duplicate — stops the endpoint being used to bulk-create entries.
    const [existing] = await tx
      .select({ id: moodEntries.id })
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .limit(1);
    if (existing) {
      alreadyClaimed = true;
      return;
    }
    await tx.insert(moodEntries).values({
      id,
      userId,
      moodTypeId: guest.moodTypeId,
      note: guest.note?.trim()?.slice(0, 2000) || null,
      tags: (guest.tags ?? []).slice(0, 12),
      sentiment: guest.sentiment ?? null,
      aiSummary: guest.aiSummary ?? null,
      aiSource: "nlp",
      date: todayKey(),
    });
  });

  if (alreadyClaimed) return NextResponse.json({ ok: true, alreadyClaimed: true });
  return NextResponse.json({ ok: true, id });
}
