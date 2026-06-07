import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { socialLogin } from "@/lib/mobile-auth";

// Native Google sign-in: the app does the Google flow, then posts the resulting
// ID token here. We verify it against Google's JWKS and map to our account by
// email (creating one if new), so web Google users land on their existing data.
export async function POST(req: NextRequest) {
  const rl = await rateLimit({ key: `msocial:google:${clientIp(req)}`, limit: 20, windowSec: 900 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const body = (await req.json().catch(() => null)) as { idToken?: string; device?: string } | null;
  const device = body?.device ?? req.headers.get("user-agent");
  const { status, body: res } = await socialLogin("Google", body, device);
  return NextResponse.json(res, { status });
}
