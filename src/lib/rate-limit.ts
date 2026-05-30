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

export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const db = getDb();
  const now = new Date();
  const resetAt = new Date(now.getTime() + opts.windowSec * 1000);

  // Single atomic upsert — increment within the live window, or reset the window
  // if it has expired. Doing this in one statement (rather than read-then-write)
  // closes the race where concurrent requests both read the same count and each
  // write count+1, letting a burst slip past the limit.
  const [row] = await db
    .insert(rateLimits)
    .values({ key: opts.key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} < ${now} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} < ${now} then ${resetAt} else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  if (row.count > opts.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000));
    return { ok: false, retryAfterSec };
  }

  return { ok: true };
}
