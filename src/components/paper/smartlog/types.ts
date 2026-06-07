export type Tier = "guest" | "free" | "premium";

export interface MoodItem {
  id: string;
  emoji: string;
  label: string;
  labelTh: string | null;
  color: string;
  iconKey: string | null;
}

export interface AiSuggestion {
  suggestedMoodId: string;
  sentiment: number | null;
  tags: string[];
  imageKey: string | null;
  aiSource: "manual" | "nlp" | "vision" | "nlp+vision";
  aiSummary: string | null;
  suggestedActivityId?: string | null;
}

export interface RateLimitInfo {
  used: number;
  limit: number;
  retryAfterSec: number;
}
