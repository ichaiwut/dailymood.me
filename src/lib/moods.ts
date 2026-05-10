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

// Hardcoded fallback — used when DB is not available (e.g. build time).
// At runtime, the pack picker reads from the mood_packs DB table via /api/moods/packs.
export const MOOD_PACKS: readonly MoodPack[] = [
  { id: "set_486038", label: "Vecteezy Classic", premium: false },
];

export function moodIconUrl(
  moodId: string,
  packId: string = DEFAULT_MOOD_PACK,
  format: string = "svg",
): string {
  return `${R2_PUBLIC_URL}/${packId}/${moodId}.${format}`;
}

export function isValidPack(packId: string): boolean {
  return !!packId && packId.length > 0;
}
