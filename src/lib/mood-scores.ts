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

export function computeWellnessScore(opts: {
  avgMood: number;
  daysWithEntries: number;
  totalDays: number;
  goodDays: number;
  streak: number;
}): number {
  const avgNorm = Math.min(1, Math.max(0, (opts.avgMood - 1) / 4));
  const consistency = opts.totalDays > 0 ? opts.daysWithEntries / opts.totalDays : 0;
  const positivity = opts.daysWithEntries > 0 ? opts.goodDays / opts.daysWithEntries : 0;
  const streakBonus = opts.streak >= 3 ? 1 : opts.streak >= 1 ? 0.5 : 0;
  return Math.round((avgNorm * 0.4 + consistency * 0.3 + positivity * 0.2 + streakBonus * 0.1) * 100);
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
