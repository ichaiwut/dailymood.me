import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { socialLogin } from "@/lib/mobile-auth";

// Native Sign in with Apple: the app posts Apple's identity token here. Required by
// App Store Guideline 4.8 whenever Google sign-in is offered. Apple only sends the
// user's name on the FIRST authorization, separately from the token, so the client
// forwards it as `name` and we apply it when creating the account.
export async function POST(req: NextRequest) {
  const rl = await rateLimit({ key: `msocial:apple:${clientIp(req)}`, limit: 20, windowSec: 900 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { idToken?: string; name?: string; device?: string }
    | null;
  const device = body?.device ?? req.headers.get("user-agent");
  const { status, body: res } = await socialLogin("Apple", body, device);
  return NextResponse.json(res, { status });
}
