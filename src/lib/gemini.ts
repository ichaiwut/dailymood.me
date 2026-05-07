import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODEL = "gemini-2.5-flash";

export interface NlpResult {
  suggestedMoodId: string; // one of DEFAULT_MOODS ids; "neutral" if unsure
  sentiment: number; // -1..1
  tags: string[]; // 3-8 short lowercase tags
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
  },
  required: ["suggestedMoodId", "sentiment", "tags"],
};

const NLP_PROMPT = `You analyze a short journal entry from a mood-tracking app and extract structured signals.
- suggestedMoodId: pick the BEST match from the enum (default to "neutral" if unclear).
- sentiment: number in [-1, 1]; -1 = very negative, 0 = neutral, 1 = very positive.
- tags: 3 to 8 short lowercase keywords describing activities, people, places, or feelings (single words or 2-word phrases). No emojis. No duplicates.
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
