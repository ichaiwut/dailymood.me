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

const NLP_PROMPT = `You analyze a short journal entry from a mood-tracking app and extract structured signals.
- suggestedMoodId: pick the BEST match from the enum (default to "neutral" if unclear).
- sentiment: number in [-1, 1]; -1 = very negative, 0 = neutral, 1 = very positive.
- tags: 3 to 8 short lowercase keywords describing activities, people, places, or feelings (single words or 2-word phrases). No emojis. No duplicates.
- summary: สรุปอารมณ์และเรื่องราวของวันนี้ 1-3 ประโยค ภาษาไทย โทนอบอุ่นเป็นกันเอง เหมือนเพื่อนที่เข้าใจ ใช้ **ตัวหนา** กับวลีสำคัญ 1-3 จุด ห้ามเริ่มด้วย "สรุปว่า" ห้ามพูดถึง AI หรือการวิเคราะห์
Respond with JSON only. The journal text may be in Thai or English.`;

export async function analyzeText(text: string): Promise<NlpResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: NLP_SCHEMA,
      temperature: 0.4,
    },
    systemInstruction: NLP_PROMPT,
  });
  const r = await model.generateContent(text);
  return JSON.parse(r.response.text()) as NlpResult;
}

const VISION_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["tags"],
};

const VISION_PROMPT = `You analyze a photo from a mood journal entry. Extract 3 to 8 short lowercase context tags
(activity, place, food, people-count, weather, object). No emojis. No duplicates. JSON only.`;

export async function analyzeImage(imageBytes: Uint8Array, mimeType: string): Promise<{ tags: string[] }> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: VISION_SCHEMA,
      temperature: 0.3,
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

const INSIGHTS_PROMPT = `You are an empathetic mood analyst for a mood-tracking app called DailyMood.
You receive a JSON object with the user's mood data over the past 30 days and must produce insights.

Rules:
- "headline": a short punchy insight (max 60 chars). Example: "สัปดาห์นี้อารมณ์ดีขึ้น 20%"
- "summary": 2-3 sentence executive summary of the week/month. Warm, encouraging tone.
- "patterns": 1-3 findings. Each has a "title" (short), "description" (1-2 sentences explaining the pattern), and "tag" (one of: "pattern" for recurring behavior, "correlation" for tag-mood links, "alert" for concerning trends).
  - Look for: which tags/activities correlate with positive or negative moods, day-of-week patterns, mood trends over time.
- "suggestion": one actionable tip based on the data, or null if no strong signal.
- Respond in the SAME language as the user's locale (provided in the data).
- Be specific — reference actual tags, moods, and days from the data. Don't make up data.
- If there's very little data, say so honestly and keep it short.`;

export async function generateInsights(data: string): Promise<InsightsResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: INSIGHTS_SCHEMA,
      temperature: 0.6,
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
