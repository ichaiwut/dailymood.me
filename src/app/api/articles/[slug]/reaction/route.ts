import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";

export async function POST(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  await req.json();
  return NextResponse.json({ ok: true });
}
