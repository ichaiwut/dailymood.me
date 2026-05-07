import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { analyzeText, analyzeImage } from "@/lib/gemini";
import { uploadObject } from "@/lib/r2";
import { FREE_NLP_DAILY_LIMIT, getNlpUsage, incNlpUsage, incVisionUsage, todayKey } from "@/lib/usage";
import { ulid } from "@/lib/ulid";

export const runtime = "edge";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB after client optimization

export async function POST(req: NextRequest) {
  const { userId, tier } = await getSessionInfo();
  if (!userId) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const form = await req.formData();
  const text = (form.get("text") as string | null)?.trim() ?? "";
  const image = form.get("image");
  const hasImage = image instanceof File && image.size > 0;

  if (!text && !hasImage) {
    return NextResponse.json({ error: "empty_input" }, { status: 400 });
  }

  // Vision is premium-only
  if (hasImage && !meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required", feature: "vision" }, { status: 403 });
  }

  // Rate limit: free users get FREE_NLP_DAILY_LIMIT NLP calls/day
  if (tier === "free") {
    const used = await getNlpUsage(userId);
    if (used >= FREE_NLP_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "rate_limited", used, limit: FREE_NLP_DAILY_LIMIT },
        { status: 429 },
      );
    }
  }

  let imageKey: string | null = null;
  let visionTags: string[] = [];

  if (hasImage) {
    const file = image as File;
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "image_too_large" }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    imageKey = `users/${userId}/${todayKey()}/${ulid()}.webp`;
    await uploadObject(imageKey, bytes, file.type || "image/webp");
    const v = await analyzeImage(bytes, file.type || "image/webp");
    visionTags = v.tags ?? [];
    await incVisionUsage(userId);
  }

  let suggestedMoodId = "neutral";
  let sentiment: number | null = null;
  let nlpTags: string[] = [];

  if (text) {
    const r = await analyzeText(text);
    suggestedMoodId = r.suggestedMoodId;
    sentiment = r.sentiment;
    nlpTags = r.tags ?? [];
    if (tier === "free") await incNlpUsage(userId);
  }

  const tags = Array.from(new Set([...nlpTags, ...visionTags])).slice(0, 12);
  const aiSource =
    text && hasImage ? "nlp+vision" : hasImage ? "vision" : text ? "nlp" : "manual";

  return NextResponse.json({
    suggestedMoodId,
    sentiment,
    tags,
    imageKey,
    aiSource,
  });
}
