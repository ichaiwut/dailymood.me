import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { personalEvents } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { eq, count } from "drizzle-orm";
import { getSpecialDaysForMonth } from "@/lib/special-days";
import { FREE_PERSONAL_EVENTS_LIMIT } from "@/lib/event-limits";

export async function GET(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = req.nextUrl;
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");

  if (yearParam && monthParam) {
    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 });
    }
    const events = await getSpecialDaysForMonth(year, month, userId);
    return NextResponse.json({ events });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(personalEvents)
    .where(eq(personalEvents.userId, userId))
    .orderBy(personalEvents.month, personalEvents.day);

  return NextResponse.json({ events: rows });
}

interface CreateBody {
  label: string;
  labelTh?: string;
  month: number;
  day: number;
  emoji?: string;
}

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as CreateBody;
  if (!body.label || !body.month || !body.day) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (body.month < 1 || body.month > 12 || body.day < 1 || body.day > 31) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const db = getDb();
  const id = ulid();

  if (!meetsTier(tier, "premium")) {
    try {
      await db.transaction(async (tx) => {
        const [{ n }] = await tx
          .select({ n: count() })
          .from(personalEvents)
          .where(eq(personalEvents.userId, userId));
        if (n >= FREE_PERSONAL_EVENTS_LIMIT) throw new Error("limit_reached");
        await tx.insert(personalEvents).values({
          id,
          userId,
          label: body.label.slice(0, 64),
          labelTh: body.labelTh?.slice(0, 64),
          month: body.month,
          day: body.day,
          emoji: (body.emoji ?? "🎉").slice(0, 8),
        });
      });
    } catch (e) {
      if (e instanceof Error && e.message === "limit_reached") {
        return NextResponse.json(
          { error: "limit_reached", limit: FREE_PERSONAL_EVENTS_LIMIT },
          { status: 409 },
        );
      }
      throw e;
    }
  } else {
    await db.insert(personalEvents).values({
      id,
      userId,
      label: body.label.slice(0, 64),
      labelTh: body.labelTh?.slice(0, 64),
      month: body.month,
      day: body.day,
      emoji: (body.emoji ?? "🎉").slice(0, 8),
    });
  }

  return NextResponse.json({ id });
}
