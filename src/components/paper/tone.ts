/**
 * Paper-desk tone helpers.
 *
 * Articles carry a `tone` (one of six) in the DB. Tone drives three things on
 * the paper-grid cards: the accent hue, the soft tint behind ArticleArt, and a
 * derived mood face for the sticker (the schema has no per-article mood, so we
 * map tone → one of the 7 system moods deterministically). The chosen moods
 * line up with the DEFAULT_MOODS colours so sticker disc + face read as one.
 */

export type Tone = "peach" | "lavender" | "mint" | "yellow" | "blue" | "purple";

export const TONES: readonly Tone[] = ["peach", "lavender", "mint", "yellow", "blue", "purple"];

/** Accent colour per tone (mirrors TONE_MAP in article-detail-shell). */
export const TONE_HUE: Record<Tone, string> = {
  peach: "var(--peach)",
  lavender: "var(--purple)",
  mint: "#2EA67D",
  yellow: "var(--yellow)",
  blue: "#5C9DBE",
  purple: "var(--purple-strong)",
};

/** Soft tinted background per tone (used under ArticleArt fallback). */
export const TONE_BG: Record<Tone, string> = {
  peach: "rgba(252,164,91,.14)",
  lavender: "rgba(166,115,241,.14)",
  mint: "rgba(133,236,203,.22)",
  yellow: "rgba(253,203,86,.22)",
  blue: "rgba(154,205,226,.28)",
  purple: "rgba(151,71,255,.14)",
};

/** Tone → system mood id (for the derived mood-face sticker). */
export const TONE_MOOD: Record<Tone, string> = {
  peach: "amazing",
  lavender: "anxious",
  mint: "happy",
  yellow: "neutral",
  blue: "sad",
  purple: "tired",
};

export function asTone(tone: string | null | undefined): Tone {
  return tone && (TONES as readonly string[]).includes(tone) ? (tone as Tone) : "peach";
}

export const toneHue = (tone: string | null | undefined): string => TONE_HUE[asTone(tone)];
export const toneBg = (tone: string | null | undefined): string => TONE_BG[asTone(tone)];
export const toneMoodId = (tone: string | null | undefined): string => TONE_MOOD[asTone(tone)];
