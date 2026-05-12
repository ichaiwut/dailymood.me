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

  const [existing] = await db
    .select({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    .from(rateLimits)
    .where(sql`${rateLimits.key} = ${opts.key}`)
    .limit(1);

  if (!existing) {
    await db.insert(rateLimits).values({ key: opts.key, count: 1, resetAt });
    return { ok: true };
  }

  const windowExpired = existing.resetAt < now;

  if (windowExpired) {
    await db
      .update(rateLimits)
      .set({ count: 1, resetAt })
      .where(sql`${rateLimits.key} = ${opts.key}`);
    return { ok: true };
  }

  const newCount = existing.count + 1;
  await db
    .update(rateLimits)
    .set({ count: newCount })
    .where(sql`${rateLimits.key} = ${opts.key}`);

  if (newCount > opts.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000));
    return { ok: false, retryAfterSec };
  }

  return { ok: true };
}
