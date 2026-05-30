import { moodIconUrl } from "@/lib/moods";

// The 7 system mood ids (mood_types rows with user_id = NULL). Kept in lockstep
// with the enum used by analyzeText() in src/lib/gemini.ts.
export const GUEST_MOOD_IDS = [
  "amazing",
  "happy",
  "neutral",
  "sad",
  "angry",
  "anxious",
  "tired",
] as const;

export type GuestMoodId = (typeof GUEST_MOOD_IDS)[number];

// Mood → CSS gradient. The landing page has no Tailwind, so we hand each mood a
// ready-to-use `linear-gradient(...)` string with enough depth for white text.
const MOOD_GRADIENTS: Record<GuestMoodId, string> = {
  amazing: "linear-gradient(135deg, #FCA45B, #F97362)",
  happy: "linear-gradient(135deg, #FDB44B, #FCA45B)",
  neutral: "linear-gradient(135deg, #A89BD6, #7C83C4)",
  sad: "linear-gradient(135deg, #7CA3D6, #5C6FB1)",
  angry: "linear-gradient(135deg, #F97362, #C2415B)",
  anxious: "linear-gradient(135deg, #C99BE8, #8B6FC4)",
  tired: "linear-gradient(135deg, #8B93A7, #525A6E)",
};

export function isGuestMoodId(id: string): id is GuestMoodId {
  return (GUEST_MOOD_IDS as readonly string[]).includes(id);
}

export function moodGradient(id: string): string {
  return isGuestMoodId(id) ? MOOD_GRADIENTS[id] : MOOD_GRADIENTS.neutral;
}

// Strip the **bold** markers analyzeText() adds — the landing card renders plain text.
export function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

export interface GuestAnalyzeResponse {
  moodId: string;
  iconUrl: string;
  gradient: string;
  summary: string;
  tags: string[];
}

export function buildGuestResponse(opts: {
  moodId: string;
  summary: string;
  tags: string[];
}): GuestAnalyzeResponse {
  const moodId = isGuestMoodId(opts.moodId) ? opts.moodId : "neutral";
  return {
    moodId,
    iconUrl: moodIconUrl(moodId),
    gradient: moodGradient(moodId),
    summary: stripMarkdown(opts.summary),
    tags: opts.tags.slice(0, 6),
  };
}
