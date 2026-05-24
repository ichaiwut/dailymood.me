import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { activities } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { eq, isNull, or, count } from "drizzle-orm";
import { FREE_ACTIVITY_LIMIT, PREMIUM_ACTIVITY_LIMIT } from "@/lib/activity-limits";

export async function GET(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select()
    .from(activities)
    .where(or(isNull(activities.userId), eq(activities.userId, userId)))
    .orderBy(activities.isDefault, activities.order);

  return NextResponse.json({ activities: rows });
}

interface CreateBody {
  label: string;
  labelTh?: string;
  emoji?: string;
}

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as CreateBody;
  if (!body.label?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const db = getDb();
  const id = ulid();
  const limit = meetsTier(tier, "premium") ? PREMIUM_ACTIVITY_LIMIT : FREE_ACTIVITY_LIMIT;

  try {
    await db.transaction(async (tx) => {
      const [{ n }] = await tx
        .select({ n: count() })
        .from(activities)
        .where(eq(activities.userId, userId));
      if (n >= limit) throw new Error("limit_reached");
      await tx.insert(activities).values({
        id,
        userId,
        emoji: (body.emoji ?? "⚡").slice(0, 8),
        label: body.label.trim().slice(0, 64),
        labelTh: body.labelTh?.trim().slice(0, 64),
        order: n,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "limit_reached") {
      return NextResponse.json(
        { error: "limit_reached", limit },
        { status: 409 },
      );
    }
    throw e;
  }

  return NextResponse.json({ id });
}
