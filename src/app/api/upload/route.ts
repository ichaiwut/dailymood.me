import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { uploadObject } from "@/lib/r2";
import { todayKey } from "@/lib/usage";
import { ulid } from "@/lib/ulid";


const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required", feature: "upload" }, { status: 403 });
  }

  const form = await req.formData();
  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "no_image" }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const imageKey = `users/${userId}/${todayKey()}/${ulid()}.webp`;
  await uploadObject(imageKey, bytes, image.type || "image/webp");

  return NextResponse.json({ imageKey });
}
