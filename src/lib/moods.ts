// Public R2 CDN — fallback hardcoded; the URL is public anyway, so this is safe.
// Keep in sync with NEXT_PUBLIC_R2_PUBLIC_URL in .env.
export const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
  "https://pub-f0f688a68f884179942645789862cf54.r2.dev";

export const DEFAULT_MOOD_PACK = "set_486038";

export interface MoodPack {
  id: string;
  label: string;
  premium: boolean;
}

// Free users get DEFAULT_MOOD_PACK only. Premium can switch.
export const MOOD_PACKS: readonly MoodPack[] = [
  { id: "set_486038", label: "Vecteezy Classic", premium: false },
];

export function moodIconUrl(
  moodId: string,
  packId: string = DEFAULT_MOOD_PACK,
): string {
  return `${R2_PUBLIC_URL}/${packId}/${moodId}.svg`;
}

export function isValidPack(packId: string): boolean {
  return MOOD_PACKS.some((p) => p.id === packId);
}
