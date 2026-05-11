import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodTypes } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { PREMIUM_CUSTOM_MOOD_LIMIT } from "@/lib/default-moods";
import { asc, count, eq, isNull, or } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  const { userId } = await getSessionInfo();
  const db = getDb();
  const where = userId
    ? or(isNull(moodTypes.userId), eq(moodTypes.userId, userId))
    : isNull(moodTypes.userId);
  const rows = await db
    .select()
    .from(moodTypes)
    .where(where)
    .orderBy(asc(moodTypes.isDefault), asc(moodTypes.order));
  return NextResponse.json({ moods: rows });
}

interface CreateBody {
  emoji: string;
  label: string;
  labelTh?: string;
  color: string;
  iconKey?: string;
}

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body.emoji || !body.label || !body.color) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
    return NextResponse.json({ error: "invalid_color" }, { status: 400 });
  }

  const db = getDb();
  const [{ n }] = await db
    .select({ n: count() })
    .from(moodTypes)
    .where(eq(moodTypes.userId, userId));
  if (n >= PREMIUM_CUSTOM_MOOD_LIMIT) {
    return NextResponse.json(
      { error: "limit_reached", limit: PREMIUM_CUSTOM_MOOD_LIMIT },
      { status: 409 },
    );
  }

  const iconKey =
    typeof body.iconKey === "string" && body.iconKey.startsWith("custom-emojis/")
      ? body.iconKey
      : null;

  const id = ulid();
  await db.insert(moodTypes).values({
    id,
    userId,
    emoji: body.emoji.slice(0, 8),
    label: body.label.slice(0, 32),
    labelTh: body.labelTh?.slice(0, 32),
    color: body.color,
    order: 100 + n,
    isDefault: false,
    iconKey,
  });
  return NextResponse.json({ id });
}
