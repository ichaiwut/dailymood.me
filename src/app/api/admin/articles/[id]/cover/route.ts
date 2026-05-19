import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadObject, deleteObject } from "@/lib/r2";

const MAX_SIZE = 6 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAction();
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("cover") as File | null;
  if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "file_too_large" }, { status: 400 });

  const ALLOWED_TYPES = new Set(["image/webp", "image/png", "image/jpeg"]);
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select({ coverImageKey: articles.coverImageKey })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const key = `articles/${id}/cover.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await uploadObject(key, bytes, file.type);

  const oldKey = existing.coverImageKey;
  await db.update(articles).set({ coverImageKey: key, updatedAt: new Date() }).where(eq(articles.id, id));

  if (oldKey && oldKey !== key) {
    await deleteObject(oldKey);
  }

  return NextResponse.json({ coverImageKey: key });
}
