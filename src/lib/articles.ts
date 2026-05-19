export function calcReadingTime(bodyTh: string, bodyEn: string): number {
  // Thai uses ~900 chars/min (no spaces between words), EN uses ~200 words/min
  const thMinutes = bodyTh.replace(/\s+/g, "").length / 900;
  const enMinutes = bodyEn.split(/\s+/).filter(Boolean).length / 200;
  return Math.max(1, Math.round(Math.max(thMinutes, enMinutes)));
}
