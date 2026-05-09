import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODEL = "gemini-2.5-flash";

export interface NlpResult {
  suggestedMoodId: string; // one of DEFAULT_MOODS ids; "neutral" if unsure
  sentiment: number; // -1..1
  tags: string[]; // 3-8 short lowercase tags
  summary: string;
}

const NLP_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    suggestedMoodId: {
      type: SchemaType.STRING,
      enum: ["amazing", "happy", "neutral", "sad", "angry", "anxious", "tired"],
      format: "enum",
    },
    sentiment: { type: SchemaType.NUMBER },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    summary: { type: SchemaType.STRING },
  },
  required: ["suggestedMoodId", "sentiment", "tags", "summary"],
};

const NLP_PROMPT = `Mood journal analyzer. Input: TH/EN text. Output JSON.
suggestedMoodId: best enum match, default "neutral".
sentiment: -1..1.
tags: 3-8 lowercase keywords (activities/people/places/feelings).
summary: 1-2 ประโยค ภาษาไทย อบอุ่น ใช้**ตัวหนา**วลีสำคัญ 1-2 จุด ห้ามขึ้นต้น"สรุปว่า"`;

export async function analyzeText(text: string): Promise<NlpResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: NLP_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: 256,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: NLP_PROMPT,
  });
  const r = await model.generateContent(text.slice(0, 500));
  return JSON.parse(r.response.text()) as NlpResult;
}

const VISION_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["tags"],
};

const VISION_PROMPT = `Photo context tagger. Extract 3-6 lowercase tags (activity/place/food/weather/object). JSON only.`;

export async function analyzeImage(imageBytes: Uint8Array, mimeType: string): Promise<{ tags: string[] }> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: VISION_SCHEMA,
      temperature: 0.3,
      maxOutputTokens: 128,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: VISION_PROMPT,
  });
  // Gemini SDK expects base64 inline data — chunk to avoid stack overflow on large images
  const base64 = uint8ToBase64(imageBytes);
  const r = await model.generateContent([
    { inlineData: { data: base64, mimeType } },
  ]);
  return JSON.parse(r.response.text()) as { tags: string[] };
}

// ── Insights: executive summary + correlation ──

export interface InsightsResult {
  summary: string;
  headline: string;
  patterns: { title: string; description: string; tag: string }[];
  suggestion: { title: string; description: string } | null;
}

const INSIGHTS_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    headline: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    patterns: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          tag: {
            type: SchemaType.STRING,
            enum: ["pattern", "correlation", "alert"],
            format: "enum",
          },
        },
        required: ["title", "description", "tag"],
      },
    },
    suggestion: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
      },
      required: ["title", "description"],
    },
  },
  required: ["headline", "summary", "patterns"],
};

const INSIGHTS_PROMPT = `Mood insight generator. Input: 30-day mood summary JSON. Output JSON in user's locale.
headline: ≤60 chars punchy insight.
summary: 1-2 sentences, warm tone.
patterns: 1-2 findings (title+description+tag:pattern|correlation|alert). Reference actual data.
suggestion: one tip or null.`;

export async function generateInsights(data: string): Promise<InsightsResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: INSIGHTS_SCHEMA,
      temperature: 0.6,
      maxOutputTokens: 400,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: INSIGHTS_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as InsightsResult;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000; // 32 KB — safe under spread/argv limits
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[],
    );
  }
  return btoa(binary);
}
