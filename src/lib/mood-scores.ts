export const MOOD_SCORES: Record<string, number> = {
  amazing: 5,
  happy: 4,
  neutral: 3,
  sad: 2,
  angry: 1,
  anxious: 2,
  tired: 2,
};

export function moodScore(id: string): number {
  return MOOD_SCORES[id] ?? 3;
}

export function scoreToEmoji(score: number): string {
  if (score >= 4.5) return "\u{1F604}";
  if (score >= 3.5) return "\u{1F642}";
  if (score >= 2.5) return "\u{1F610}";
  if (score >= 1.5) return "\u{1F614}";
  return "\u{1F622}";
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function computeStreak(dates: Set<string>): number {
  let streak = 0;
  for (let i = 0; ; i++) {
    if (dates.has(ymd(addDays(new Date(), -i)))) streak++;
    else break;
  }
  return streak;
}

export function isoWeekKey(d: Date): string {
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${tmp.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
