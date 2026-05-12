import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getNlpUsage, FREE_NLP_DAILY_LIMIT } from "@/lib/usage";

export async function GET() {
  const { userId, tier } = await getSessionInfo();
  if (!userId) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  if (tier === "premium") {
    return NextResponse.json({ tier: "premium" });
  }

  const used = await getNlpUsage(userId);
  const remaining = Math.max(0, FREE_NLP_DAILY_LIMIT - used);

  return NextResponse.json({ used, limit: FREE_NLP_DAILY_LIMIT, remaining, tier });
}
