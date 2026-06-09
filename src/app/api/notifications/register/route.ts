import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { deviceTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ulid } from "@/lib/ulid";
import { isExpoPushToken } from "@/lib/push";

// The mobile app registers its Expo push token here after the user grants
// notification permission (and re-registers on token refresh). Bearer auth.
export async function POST(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { token?: string; platform?: string } | null;
  const token = body?.token?.trim();
  if (!token || !isExpoPushToken(token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  const platform = body?.platform === "ios" || body?.platform === "android" ? body.platform : null;

  const db = getDb();
  // Upsert by token: the same device re-registering (incl. after switching accounts)
  // moves the row to the current user and refreshes lastUsedAt.
  await db
    .insert(deviceTokens)
    .values({ id: ulid(), userId, token, platform, lastUsedAt: new Date() })
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: { userId, platform, lastUsedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}

// Called by the app on logout to stop pushing to this device.
export async function DELETE(req: NextRequest) {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

  // Scope the delete to the caller so one user can't unregister another's device.
  await getDb().delete(deviceTokens).where(and(eq(deviceTokens.token, token), eq(deviceTokens.userId, userId)));
  return NextResponse.json({ ok: true });
}
