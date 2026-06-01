import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/cf";
import { rateLimits } from "@/db/schema";

// Collapse an IPv6 address to its /64 network prefix (first 4 hextets), expanding
// any "::" run first. ISPs hand a single customer a whole /64 (or larger), so a
// per-address limit lets them rotate through billions of IPs for free; keying on
// the /64 applies the limit per-allocation instead.
function ipv6Prefix64(addr: string): string {
  const dbl = addr.indexOf("::");
  let groups: string[];
  if (dbl >= 0) {
    const left = addr.slice(0, dbl).split(":").filter(Boolean);
    const right = addr.slice(dbl + 2).split(":").filter(Boolean);
    const fill = Math.max(0, 8 - left.length - right.length);
    groups = [...left, ...Array(fill).fill("0"), ...right];
  } else {
    groups = addr.split(":");
  }
  return groups.slice(0, 4).map((g) => g || "0").join(":") + "::/64";
}

export function clientIp(req: NextRequest): string {
  let ip = "unknown";
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) ip = cf;
  else {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) ip = xff.split(",")[0].trim();
  }
  if (ip === "unknown") return ip;
  ip = ip.replace(/^\[|\]$/g, "").split("%")[0]; // strip [brackets] and %zone-id
  if (!ip.includes(":")) return ip; // IPv4 → as-is
  if (ip.includes(".")) return ip.split(":").pop() || ip; // IPv4-mapped (::ffff:1.2.3.4) → the v4 part
  return ipv6Prefix64(ip); // true IPv6 → /64 bucket
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
