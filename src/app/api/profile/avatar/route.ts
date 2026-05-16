import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadObject, deleteObject } from "@/lib/r2";
import { ulid } from "@/lib/ulid";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required", feature: "avatar" }, { status: 403 });
  }

  const form = await req.formData();
  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "no_image" }, { status: 400 });
  }
  if (image.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  }

  const db = getDb();

  const [row] = await db
    .select({ imageKey: users.imageKey })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const oldKey = row?.imageKey;

  const newKey = `users/${userId}/avatar/${ulid()}.webp`;
  const bytes = new Uint8Array(await image.arrayBuffer());
  await uploadObject(newKey, bytes, "image/webp");

  await db.update(users).set({ imageKey: newKey }).where(eq(users.id, userId));

  if (oldKey) {
    await deleteObject(oldKey).catch(() => {});
  }

  return NextResponse.json({ imageKey: newKey });
}

export async function DELETE() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();

  const [row] = await db
    .select({ imageKey: users.imageKey })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (row?.imageKey) {
    await deleteObject(row.imageKey).catch(() => {});
    await db.update(users).set({ imageKey: null }).where(eq(users.id, userId));
  }

  return NextResponse.json({ ok: true });
}
