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
  const now = Date.now();
  const resetAt = new Date(now + opts.windowSec * 1000);

  // Atomic upsert that resets the window when expired and increments otherwise.
  // SQLite UPSERT with conditional update via excluded.
  await db
    .insert(rateLimits)
    .values({ key: opts.key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} < ${now} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} < ${now} THEN ${resetAt.getTime()} ELSE ${rateLimits.resetAt} END`,
      },
    });

  const [row] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(sql`${rateLimits.key} = ${opts.key}`)
    .limit(1);

  if (!row) return { ok: true };
  if (row.count > opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((row.resetAt.getTime() - now) / 1000)),
    };
  }
  return { ok: true };
}
