import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { uploadObject } from "@/lib/r2";
import { getDb } from "@/lib/cf";
import { moodPacks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_MOOD_IDS } from "@/lib/default-moods";


const ALLOWED: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "image/png": "png",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id: packId } = await params;

  const form = await req.formData();
  const uploaded: string[] = [];
  let detectedFormat: string | null = null;

  for (const moodId of DEFAULT_MOOD_IDS) {
    const file = form.get(moodId);
    if (!file || !(file instanceof File)) continue;

    const ext = ALLOWED[file.type] ?? (file.name.endsWith(".svg") ? "svg" : null);
    if (!ext) {
      return NextResponse.json(
        { error: "invalid_type", moodId, type: file.type, allowed: Object.keys(ALLOWED) },
        { status: 400 },
      );
    }

    if (!detectedFormat) detectedFormat = ext;

    const buf = await file.arrayBuffer();
    const key = `${packId}/${moodId}.${ext}`;
    await uploadObject(key, buf, file.type);
    uploaded.push(moodId);
  }

  if (detectedFormat) {
    const db = getDb();
    await db.update(moodPacks).set({ iconFormat: detectedFormat }).where(eq(moodPacks.id, packId));
  }

  return NextResponse.json({ uploaded, packId, format: detectedFormat });
}
