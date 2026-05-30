import { NextRequest, NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { analyzeText } from "@/lib/gemini";
import { getDb } from "@/lib/cf";
import { guestEntries } from "@/db/schema";
import { ulid } from "@/lib/ulid";
import { buildGuestResponse } from "@/lib/guest-mood";

// Public, unauthenticated endpoint powering the landing-page "try the AI" widget.
// Called cross-origin from dailymood.me, so it carries explicit CORS headers and
// is IP rate-limited to protect the AI quota.

const ALLOWED_ORIGINS = [
  "https://dailymood.me",
  "https://www.dailymood.me",
];

const MIN_LEN = 5;
const MAX_LEN = 300;
const TOKEN_TTL_SEC = 2 * 60 * 60; // parked result is redeemable for 2h (covers email-verify signup)

// The IP rate limit is the only gate on this paid (Gemini) endpoint, and
// clientIp() trusts the cf-connecting-ip / x-forwarded-for headers — forgeable by
// anyone who can reach the origin directly (bypassing Cloudflare). When
// CF_ORIGIN_SECRET is set, every legitimate request is proxied through Cloudflare,
// which injects this shared header via a Transform Rule; requests hitting the
// origin directly won't carry it and are rejected, so the per-IP limit can't be
// defeated by rotating a spoofed IP. Unset (e.g. local dev) → check is a no-op.
function originVerified(req: NextRequest): boolean {
  const secret = process.env.CF_ORIGIN_SECRET;
  if (!secret) return true;
  return req.headers.get("x-cf-origin-secret") === secret;
}

function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return null;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = getAllowedOrigin(req);
  if (!origin) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = getAllowedOrigin(req);
  const cors = origin ? corsHeaders(origin) : {};

  if (!originVerified(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: cors });
  }

  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim() ?? "";

  if (text.length < MIN_LEN) {
    return NextResponse.json({ error: "too_short" }, { status: 400, headers: cors });
  }
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: "too_long" }, { status: 400, headers: cors });
  }

  // Rate limit: 3/hour and 10/day per IP. Hourly checked first so a blocked
  // hourly request doesn't also burn the daily allowance unnecessarily.
  const ip = clientIp(req);
  const hourly = await rateLimit({ key: `guest_analyze_h:${ip}`, limit: 3, windowSec: 3600 });
  if (!hourly.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: hourly.retryAfterSec },
      { status: 429, headers: { ...cors, "retry-after": String(hourly.retryAfterSec) } },
    );
  }
  const daily = await rateLimit({ key: `guest_analyze_d:${ip}`, limit: 10, windowSec: 86400 });
  if (!daily.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: daily.retryAfterSec },
      { status: 429, headers: { ...cors, "retry-after": String(daily.retryAfterSec) } },
    );
  }

  let result;
  try {
    const ai = await analyzeText(text);
    result = buildGuestResponse({
      moodId: ai.suggestedMoodId,
      summary: ai.summary,
      tags: ai.tags,
    });

    // Park the result so it can be redeemed into a real entry after login.
    const token = ulid();
    const db = getDb();

    // Opportunistic sweep: parked rows are short-lived and most are never claimed,
    // so drop anything past its TTL on the way in. Bounded by the rate limit above,
    // this keeps the table from growing unbounded without needing a cron.
    await db.delete(guestEntries).where(lt(guestEntries.expiresAt, new Date()));

    await db.insert(guestEntries).values({
      token,
      moodTypeId: result.moodId,
      note: text,
      tags: result.tags,
      sentiment: ai.sentiment,
      aiSummary: result.summary,
      expiresAt: new Date(Date.now() + TOKEN_TTL_SEC * 1000),
    });

    return NextResponse.json({ ...result, token }, { headers: cors });
  } catch (err) {
    console.error("[guest/analyze] failed:", err);
    return NextResponse.json({ error: "ai_failed" }, { status: 500, headers: cors });
  }
}
