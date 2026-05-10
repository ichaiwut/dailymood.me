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
  previewHeadline: string;
  patterns: {
    title: string;
    description: string;
    tag: string;
    miniVizData?: number[];
  }[];
  suggestion: { title: string; description: string } | null;
}

const INSIGHTS_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    headline: { type: SchemaType.STRING },
    previewHeadline: { type: SchemaType.STRING },
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
          miniVizData: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER },
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
  required: ["headline", "previewHeadline", "summary", "patterns"],
};

const INSIGHTS_PROMPT = `Weekly mood insight generator. Input: user's recent mood data JSON. This is a WEEKLY summary — always frame observations as "this week" or "the past week", never "this month".
headline: ≤60 chars punchy weekly insight.
previewHeadline: ≤30 chars teaser version of headline.
summary: 4-6 sentences, warm observational tone about this week. Cover overall mood trend, notable highs/lows, what influenced them, and a closing reflection. Use **bold** for key phrases. Never judgmental. Say "สัปดาห์นี้" (TH) or "this week" (EN), never "เดือนนี้" or "this month".
patterns: 1-3 findings (title+description+tag:pattern|correlation|alert). Reference actual data. miniVizData: optional array of up to 7 numbers (1-5 scale) representing a mini trend relevant to the pattern.
suggestion: one actionable tip or null. Frame as gentle invitation, not instruction.
Use "highest/lowest" not "best/worst". Use "correlates with" not "causes".`;

export async function generateInsights(data: string): Promise<InsightsResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: INSIGHTS_SCHEMA,
      temperature: 0.6,
      maxOutputTokens: 1200,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: INSIGHTS_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as InsightsResult;
}

// ── Calendar AI: monthly summary + patterns ──

export interface CalendarAiResult {
  summary: string;
  summaryFirstSentence: string;
  highlights: {
    bestDay: { date: string; emoji: string } | null;
    hardDay: { date: string; emoji: string } | null;
    topTag: string | null;
  };
  patterns: {
    type: "best" | "recurring" | "anomaly";
    dates: string[];
    title: string;
    explanation: string;
    icon: string;
  }[];
}

const CALENDAR_AI_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    summaryFirstSentence: { type: SchemaType.STRING },
    highlights: {
      type: SchemaType.OBJECT,
      properties: {
        bestDay: {
          type: SchemaType.OBJECT,
          properties: {
            date: { type: SchemaType.STRING },
            emoji: { type: SchemaType.STRING },
          },
          required: ["date", "emoji"],
        },
        hardDay: {
          type: SchemaType.OBJECT,
          properties: {
            date: { type: SchemaType.STRING },
            emoji: { type: SchemaType.STRING },
          },
          required: ["date", "emoji"],
        },
        topTag: { type: SchemaType.STRING },
      },
    },
    patterns: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            enum: ["best", "recurring", "anomaly"],
            format: "enum",
          },
          dates: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          title: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          icon: { type: SchemaType.STRING },
        },
        required: ["type", "dates", "title", "explanation", "icon"],
      },
    },
  },
  required: ["summary", "summaryFirstSentence", "highlights", "patterns"],
};

const CALENDAR_AI_PROMPT = `Monthly mood calendar analyzer. Input: JSON with user's mood data for one month.
Output JSON in user's locale (th/en).

summary: 2-3 warm observational sentences about the month. Use **double asterisks** to bold 1-2 key phrases. Never start with "สรุปว่า".
summaryFirstSentence: exact first sentence of summary (keep **bold** as-is).
highlights.bestDay: date (YYYY-MM-DD) with highest mood score + mood emoji. null if unclear.
highlights.hardDay: date with lowest mood score + mood emoji. null if unclear.
highlights.topTag: most correlated tag with high mood, or most frequent tag. null if no tags.
patterns: ALWAYS return exactly 3 items:
  1. type "best": the single best day of the month, dates=[that date], title=short warm label.
  2. type "recurring": find a weekday pattern (e.g. "Mondays are tough") or a tag pattern (e.g. "coffee days are happier"). Look at day-of-week mood averages and tag correlations. dates=all matching days in the month.
  3. type "recurring" or "anomaly": find a second pattern — could be another weekday trend, a tag correlation, or an outlier day. dates=matching days.
  - title: ≤40 chars, human-friendly label in user's locale (not mood IDs like "anxious").
  - explanation: 1 sentence referencing actual data (counts, dates, mood names in user's locale).
  - icon: single emoji representing the pattern.
Always return 3 patterns. Use dowCounts and topTags from the input to find recurring patterns.`;

export async function generateCalendarAi(data: string): Promise<CalendarAiResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: CALENDAR_AI_SCHEMA,
      temperature: 0.5,
      maxOutputTokens: 600,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: CALENDAR_AI_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as CalendarAiResult;
}

// ── Ask AI: natural language search ──

export interface AskAiResult {
  answer: string;
  matchingDates: string[];
}

const ASK_AI_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    answer: { type: SchemaType.STRING },
    matchingDates: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["answer", "matchingDates"],
};

const ASK_AI_PROMPT = `Mood calendar assistant. Input: user's monthly mood JSON + a question.
Output JSON in user's locale (th/en).
answer: 2-3 sentences directly answering the question, referencing actual dates and moods. Warm, non-clinical tone.
matchingDates: YYYY-MM-DD dates specifically relevant to the answer. Empty array if none.`;

export async function generateAskAi(data: string): Promise<AskAiResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ASK_AI_SCHEMA,
      temperature: 0.6,
      maxOutputTokens: 300,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: ASK_AI_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as AskAiResult;
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
