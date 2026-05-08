import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/cf";
import { rateLimits } from "@/db/schema";

export function clientIp(req: NextRequest): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

// Fixed-window rate limit on D1.
// Returns { ok: true } if allowed; { ok: false, retryAfterSec } when over limit.
export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const db = getDb();
  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);
  const resetAtSec = nowSec + opts.windowSec;
  const resetAt = new Date(resetAtSec * 1000);

  await db
    .insert(rateLimits)
    .values({ key: opts.key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} < ${nowSec} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} < ${nowSec} THEN ${resetAtSec} ELSE ${rateLimits.resetAt} END`,
      },
    });

  const [row] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(sql`${rateLimits.key} = ${opts.key}`)
    .limit(1);

  if (!row) return { ok: true };
  if (row.count > opts.limit) {
    const retryAfter = Math.max(1, Math.ceil(row.resetAt.getTime() / 1000) - nowSec);
    return { ok: false, retryAfterSec: retryAfter };
  }
  return { ok: true };
}
