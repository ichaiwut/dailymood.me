import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { rotateRefreshToken, getMobileUser } from "@/lib/mobile-auth";

// Exchange a refresh token for a fresh access + refresh pair (rotation).
export async function POST(req: NextRequest) {
  const rl = await rateLimit({ key: `mrefresh:${clientIp(req)}`, limit: 60, windowSec: 3600 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { refreshToken?: string; device?: string }
    | null;
  const raw = body?.refreshToken;
  if (!raw) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const device = body?.device ?? req.headers.get("user-agent");
  const result = await rotateRefreshToken(raw, device);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === "expired" ? "token_expired" : "invalid_token" },
      { status: 401 },
    );
  }

  // Include the user so a profile change (name/avatar) propagates on the next
  // refresh, keeping the contract consistent with login / google / apple.
  const user = await getMobileUser(result.userId);
  return NextResponse.json({ ...result.tokens, user });
}
