import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return _genAI;
}
const genAI = { getGenerativeModel: (...args: Parameters<GoogleGenerativeAI["getGenerativeModel"]>) => getGenAI().getGenerativeModel(...args) };

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
patterns: ALWAYS return exactly 3 findings:
  1. tag "pattern": a recurring behavioral or mood pattern this week. Include miniVizData (7 numbers, 1-5 scale, one per day Mon-Sun).
  2. tag "correlation": a tag/activity correlation with mood. Mention specific tags with # prefix.
  3. tag "alert": an anomaly, unusual shift, or notable observation. If nothing stands out, make a gentle positive observation.
Each pattern: title (≤40 chars) + description (1-2 sentences referencing data) + tag + optional miniVizData.
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

// ── Ask AI Chat: multi-turn conversation ──

import type { ChatResponse, AskAiSource } from "@/db/schema";

const CHAT_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    answer: { type: SchemaType.STRING },
    sources: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          kind: { type: SchemaType.STRING, enum: ["entry", "tag", "pattern"], format: "enum" },
          ref: { type: SchemaType.STRING },
          snippet: { type: SchemaType.STRING },
        },
        required: ["kind", "ref", "snippet"],
      },
    },
    entriesUsed: { type: SchemaType.NUMBER },
  },
  required: ["answer", "sources", "entriesUsed"],
};

const CHAT_PROMPT = `Mood journal AI assistant. You answer questions about the user's mood data.
Input: JSON with the user's mood entries, conversation history, and current question.

answer: 2-4 sentences in user's locale (th/en). Warm, observational tone. Reference specific dates, moods, and tags from the data. Use **bold** for key findings. Never clinical or judgmental. Use "ดูเหมือน" not "คุณเป็น". If data doesn't support an answer, say so honestly.
sources: 2-5 evidence items from the data that support your answer. kind="entry" for specific date entries, kind="tag" for tag patterns, kind="pattern" for behavioral patterns. ref=date or tag name. snippet=brief description.
entriesUsed: number of entries you analyzed.

For follow-up questions, consider the conversation history. Build on previous answers, don't repeat.
Do NOT answer questions unrelated to the user's mood/wellbeing data.`;

export async function generateChatResponse(data: string): Promise<ChatResponse> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: CHAT_SCHEMA,
      temperature: 0.6,
      maxOutputTokens: 800,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: CHAT_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as ChatResponse;
}

// ── Forecast: predict tomorrow's mood ──

import type { ForecastResult } from "@/db/schema";

const FORECAST_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    predictedMood: {
      type: SchemaType.STRING,
      enum: ["amazing", "happy", "neutral", "sad", "angry", "anxious", "tired"],
      format: "enum",
    },
    confidence: { type: SchemaType.NUMBER },
    reasoning: { type: SchemaType.STRING },
    factors: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          direction: { type: SchemaType.STRING, enum: ["+", "-"], format: "enum" },
          label: { type: SchemaType.STRING },
        },
        required: ["direction", "label"],
      },
    },
    miniTrend: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
  },
  required: ["predictedMood", "confidence", "reasoning", "factors", "miniTrend"],
};

const FORECAST_PROMPT = `Mood forecaster. Input: user's recent mood data JSON with day-of-week patterns, recent trends, and tag patterns.
Predict tomorrow's likely mood. Output JSON in user's locale (th/en).

predictedMood: most likely mood enum for tomorrow.
confidence: 0.0-1.0 how confident (be realistic, usually 0.5-0.8).
reasoning: 1-2 sentences explaining prediction in warm tone. Use "มีแนวโน้ม" (TH) or "tends to" (EN), never "จะเป็น" or "will be". Reference specific patterns from data.
factors: 2-4 contributing factors. direction "+" for positive, "-" for negative. label: short description in user's locale.
miniTrend: last 7 mood scores (1-5 scale) from the data.

Never claim certainty. Frame as gentle observation, not prescription.`;

export async function generateForecast(data: string): Promise<ForecastResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: FORECAST_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: 400,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: FORECAST_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as ForecastResult;
}

// ── AI Coach: daily personalized tip ──

export interface CoachTipResult {
  title: string;
  tip: string;
  emoji: string;
}

const COACH_TIP_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    tip: { type: SchemaType.STRING },
    emoji: { type: SchemaType.STRING },
  },
  required: ["title", "tip", "emoji"],
};

const COACH_TIP_PROMPT = `Mood coach for daily tips. Input: JSON with user's recent mood patterns and top tags.
Generate a short, warm, actionable tip for today. Output JSON in user's locale (th/en).
title: ≤30 chars, catchy headline.
tip: 2-3 sentences, warm personal tone. Reference the user's actual patterns. Suggest one small action. Never clinical.
emoji: single emoji representing the tip.`;

export async function generateCoachTip(data: string): Promise<CoachTipResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: COACH_TIP_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 200,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: COACH_TIP_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as CoachTipResult;
}

// ── Themes: recurring topics ──

export interface ThemesResult {
  themes: { label: string; count: number; color: string }[];
}

const THEMES_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    themes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          count: { type: SchemaType.NUMBER },
          color: { type: SchemaType.STRING },
        },
        required: ["label", "count", "color"],
      },
    },
  },
  required: ["themes"],
};

const THEMES_PROMPT = `Journal theme extractor. Input: JSON with user's recent journal snippets and tags.
Find the 5 most recurring themes/topics. Output JSON in user's locale (th/en).
themes: array of 5 items, sorted by count descending.
  label: 1-3 words describing the theme (e.g. "งาน/deadline", "ครอบครัว", "การนอน").
  count: number of entries that mention this theme.
  color: a hex color for the theme bar (use warm, distinct colors: #FCA45B, #85ECCB, #A673F1, #FDCB56, #9ACDE2).`;

export async function generateThemes(data: string): Promise<ThemesResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: THEMES_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: 300,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: THEMES_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as ThemesResult;
}

// ── Mood DNA: personality archetype ──

export interface DnaResult {
  archetype: string;
  archetypeIcon: string;
  description: string;
}

const DNA_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    archetype: { type: SchemaType.STRING },
    archetypeIcon: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
  },
  required: ["archetype", "archetypeIcon", "description"],
};

const DNA_PROMPT = `Mood personality analyzer. Input: JSON with user's 5-axis mood profile (bright, calm, energy, social, depth, each 0-40) and average mood score.
Determine their mood personality archetype. Output JSON in user's locale (th/en).
archetype: a creative 2-3 word personality name (e.g. "Morning Optimist", "Steady Sage", "Creative Tide", "นักสำรวจเงียบ", "จิตวิญญาณอิสระ"). Pick from 12 archetypes based on the top 2 axes.
archetypeIcon: single emoji that represents this archetype.
description: 1 sentence describing this personality type in warm, affirming tone.`;

export async function generateDna(data: string): Promise<DnaResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: DNA_SCHEMA,
      temperature: 0.5,
      maxOutputTokens: 200,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: DNA_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as DnaResult;
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

// ── Year in Pixels: yearly AI summary ──

import type { YearAiResult } from "@/db/schema";

const YEAR_AI_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    summaryShort: { type: SchemaType.STRING },
    bestQuarter: { type: SchemaType.STRING },
    hardestPeriod: { type: SchemaType.STRING },
    yearTheme: { type: SchemaType.STRING },
  },
  required: ["summary", "summaryShort", "bestQuarter", "hardestPeriod", "yearTheme"],
};

const YEAR_AI_PROMPT = `Yearly mood analyzer. Input: JSON with user's mood data aggregated by month for one full year.
Output JSON in user's locale (th/en). Warm, personal, observational tone — like a supportive friend reviewing the year.

summary: 3-4 sentences summarizing the year. Use **double asterisks** to bold 2-3 key phrases. Mention specific months by name. Reference actual mood patterns, best/worst periods, and notable trends. Never start with "สรุปว่า" or "Overall".
summaryShort: exact first sentence of summary (keep **bold** as-is).
bestQuarter: 1 sentence about the best quarter/period and why (reference month names and mood data).
hardestPeriod: 1 sentence about the hardest period and what patterns appeared (reference month names).
yearTheme: a short 3-5 word label capturing the year's emotional theme (e.g. "ปีแห่งการเติบโต", "Year of Recovery").`;

export async function generateYearAi(data: string): Promise<YearAiResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: YEAR_AI_SCHEMA,
      temperature: 0.5,
      maxOutputTokens: 800,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: YEAR_AI_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as YearAiResult;
}

// ── Article Key Takeaway ──

export interface KeyTakeawayResult {
  th: string;
  en: string;
}

const KEY_TAKEAWAY_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    th: { type: SchemaType.STRING },
    en: { type: SchemaType.STRING },
  },
  required: ["th", "en"],
};

const KEY_TAKEAWAY_PROMPT = `สรุปคีย์สำคัญของบทความดูแลสุขภาพใจ ยาว 5-7 บรรทัด (150-250 คำ)

โทน: สุภาพ professional แต่อ่านง่าย เหมือนบทความจากนักจิตวิทยา
- ใช้ภาษาเขียนที่สุภาพ ไม่ใช่ภาษาพูด
- ห้ามใช้คำว่า "เฮ้ย" "แก" "นะ" "สิ" "ดูสิ" "เลยนะ" "ง่ายมากๆ" หรือคำพูดแบบเพื่อน
- ห้ามใช้เครื่องหมายตกใจ (!)
- ใช้ "ครับ" ปิดท้ายได้บ้าง แต่ไม่ต้องทุกประโยค

เนื้อหา:
- หยิบ key point สำคัญจากบทความมาอธิบายต่อแบบกระชับ
- บอกเหตุผลว่าทำไมถึงสำคัญ + แนวทางเริ่มต้นทำจริง
- ห้ามขึ้นต้นด้วย "สรุปว่า" หรือ "บทความนี้"
- ห้ามชวนสมัครหรือใช้แอป เพราะคนอ่านเป็นสมาชิกอยู่แล้ว
- ห้ามพูดถึง DailyMood หรือชื่อแอป
- ใช้ **ตัวหนา** เน้นวลีสำคัญได้ 2-3 จุด

Input: JSON { titleTh, titleEn, bodyTh, bodyEn }
Output: JSON { th, en } — th ภาษาไทย, en ภาษาอังกฤษ`;

export async function generateKeyTakeaway(data: string): Promise<KeyTakeawayResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: KEY_TAKEAWAY_SCHEMA,
      temperature: 0.5,
      maxOutputTokens: 1000,
      // @ts-expect-error -- thinkingConfig not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: KEY_TAKEAWAY_PROMPT,
  });
  const r = await model.generateContent(data);
  return JSON.parse(r.response.text()) as KeyTakeawayResult;
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
