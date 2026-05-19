import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { articleCategories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ulid } from "@/lib/ulid";

export async function GET() {
  await requireAdminAction();
  const db = getDb();
  const rows = await db.select().from(articleCategories).orderBy(asc(articleCategories.order));
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  await requireAdminAction();
  const body = await req.json();
  const { slug, labelTh, labelEn, order } = body as {
    slug: string;
    labelTh: string;
    labelEn: string;
    order?: number;
  };

  if (!slug || !labelTh || !labelEn) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const db = getDb();
  const id = ulid();
  try {
    await db.insert(articleCategories).values({
      id,
      slug,
      labelTh,
      labelEn,
      order: order ?? 0,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("unique")) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ id });
}
