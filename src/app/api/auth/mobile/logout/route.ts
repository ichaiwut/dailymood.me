import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { revokeRefreshToken } from "@/lib/mobile-auth";

// Revoke the presented refresh token. The (short-lived) access token is left to
// expire on its own. Always 200 so logout is idempotent and leaks nothing.
export async function POST(req: NextRequest) {
  const rl = await rateLimit({ key: `mlogout:${clientIp(req)}`, limit: 60, windowSec: 3600 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const body = (await req.json().catch(() => null)) as { refreshToken?: string } | null;
  if (body?.refreshToken) {
    await revokeRefreshToken(body.refreshToken);
  }
  return NextResponse.json({ ok: true });
}
