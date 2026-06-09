import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getSubscriptionData } from "@/lib/subscription";


export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const data = await getSubscriptionData(userId);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(data);
}
