import { moodIconUrl } from "./moods";

export const DEFAULT_MOOD_IDS = [
  "amazing",
  "happy",
  "neutral",
  "sad",
  "angry",
  "anxious",
  "tired",
] as const;

export type DefaultMoodId = (typeof DEFAULT_MOOD_IDS)[number];

export const DEFAULT_MOODS = [
  { id: "amazing", emoji: "😄", label: "Happy",     labelTh: "มีความสุข", color: "#FCA45B", order: 0, iconUrl: moodIconUrl("amazing") },
  { id: "happy",   emoji: "🙂", label: "Calm",      labelTh: "สงบ",       color: "#85ECCB", order: 1, iconUrl: moodIconUrl("happy")   },
  { id: "neutral", emoji: "😐", label: "Neutral",   labelTh: "เฉยๆ",      color: "#FDCB56", order: 2, iconUrl: moodIconUrl("neutral") },
  { id: "sad",     emoji: "😔", label: "Sad",       labelTh: "เศร้า",     color: "#9ACDE2", order: 3, iconUrl: moodIconUrl("sad")     },
  { id: "angry",   emoji: "😠", label: "Angry",     labelTh: "โกรธ",      color: "#FEAD8D", order: 4, iconUrl: moodIconUrl("angry")   },
  { id: "anxious", emoji: "😟", label: "Anxious",   labelTh: "กังวล",     color: "#D4BEE4", order: 5, iconUrl: moodIconUrl("anxious") },
  { id: "tired",   emoji: "😴", label: "Tired",     labelTh: "เหนื่อย",   color: "#A673F1", order: 6, iconUrl: moodIconUrl("tired")   },
] as const;

export const PREMIUM_CUSTOM_MOOD_LIMIT = 13;
