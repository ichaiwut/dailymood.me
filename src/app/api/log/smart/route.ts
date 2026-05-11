import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo, meetsTier } from "@/lib/tier";
import { analyzeText, analyzeImage } from "@/lib/gemini";
import { uploadObject } from "@/lib/r2";
import { FREE_NLP_DAILY_LIMIT, getNlpUsage, incNlpUsage, incVisionUsage, todayKey } from "@/lib/usage";
import { rateLimit } from "@/lib/rate-limit";
import { ulid } from "@/lib/ulid";


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

  // Image upload is premium-only
  if (hasImage && !meetsTier(tier, "premium")) {
    return NextResponse.json({ error: "premium_required", feature: "vision" }, { status: 403 });
  }

  // Upload image to R2 first (before rate limit) so it's always saved
  let imageKey: string | null = null;
  if (hasImage) {
    const file = image as File;
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "image_too_large" }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    imageKey = `users/${userId}/${todayKey()}/${ulid()}.webp`;
    await uploadObject(imageKey, bytes, file.type || "image/webp");
  }

  if (tier === "free") {
    // Free: 1 AI call/day — no cooldown needed
    const used = await getNlpUsage(userId);
    if (used >= FREE_NLP_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "rate_limited", used, limit: FREE_NLP_DAILY_LIMIT, imageKey },
        { status: 429 },
      );
    }
  } else {
    // Premium: cooldown 1 call per 5 minutes
    const cooldown = await rateLimit({ key: `ai-cooldown:${userId}`, limit: 1, windowSec: 300 });
    if (!cooldown.ok) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSec: cooldown.retryAfterSec, imageKey },
        { status: 429 },
      );
    }
  }

  // AI Vision analysis (premium, image already uploaded above)
  let visionTags: string[] = [];
  if (hasImage && imageKey) {
    const file = image as File;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const v = await analyzeImage(bytes, file.type || "image/webp");
    visionTags = v.tags ?? [];
    await incVisionUsage(userId);
  }

  let suggestedMoodId = "neutral";
  let sentiment: number | null = null;
  let nlpTags: string[] = [];
  let aiSummary: string | null = null;

  if (text) {
    const r = await analyzeText(text);
    suggestedMoodId = r.suggestedMoodId;
    sentiment = r.sentiment;
    nlpTags = r.tags ?? [];
    if (tier === "premium") aiSummary = r.summary || null;
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
    aiSummary,
  });
}
