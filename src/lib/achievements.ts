export interface BadgeDef {
  id: string;
  icon: string;
  color: string;
  target: number;
}

export const BADGE_CATALOG: BadgeDef[] = [
  { id: "streak_7", icon: "🔥", color: "#FCA45B", target: 7 },
  { id: "streak_30", icon: "🔥", color: "#FCA45B", target: 30 },
  { id: "streak_100", icon: "🔥", color: "#FCA45B", target: 100 },
  { id: "streak_365", icon: "🔥", color: "#FCA45B", target: 365 },
  { id: "entries_50", icon: "📓", color: "#A673F1", target: 50 },
  { id: "entries_100", icon: "📓", color: "#A673F1", target: 100 },
  { id: "entries_500", icon: "📓", color: "#A673F1", target: 500 },
  { id: "early_bird", icon: "🌅", color: "#FDCB56", target: 5 },
  { id: "night_owl", icon: "🌙", color: "#A673F1", target: 10 },
  { id: "tag_master", icon: "🏷️", color: "#85ECCB", target: 20 },
  { id: "zen_30", icon: "🧘", color: "#85ECCB", target: 30 },
  { id: "photo_journal", icon: "📸", color: "#FEAD8D", target: 25 },
];

export interface BadgeProgress {
  current: number;
  target: number;
}

interface EntryRow {
  date: string;
  moodTypeId: string;
  imageKey: string | null;
  tags: string[] | null;
  createdAt: Date;
}

export function computeBadgeProgress(entries: EntryRow[]): Record<string, BadgeProgress> {
  const result: Record<string, BadgeProgress> = {};

  const dates = new Set(entries.map((e) => e.date));
  const maxStreak = computeMaxStreak(dates);
  result.streak_7 = { current: Math.min(maxStreak, 7), target: 7 };
  result.streak_30 = { current: Math.min(maxStreak, 30), target: 30 };
  result.streak_100 = { current: Math.min(maxStreak, 100), target: 100 };
  result.streak_365 = { current: Math.min(maxStreak, 365), target: 365 };

  const total = entries.length;
  result.entries_50 = { current: Math.min(total, 50), target: 50 };
  result.entries_100 = { current: Math.min(total, 100), target: 100 };
  result.entries_500 = { current: Math.min(total, 500), target: 500 };

  let earlyCount = 0;
  let nightCount = 0;
  const uniqueTags = new Set<string>();
  let photoCount = 0;

  for (const e of entries) {
    const hour = e.createdAt.getHours();
    if (hour >= 5 && hour < 8) earlyCount++;
    if (hour >= 0 && hour < 4) nightCount++;
    if (e.tags) for (const t of e.tags) uniqueTags.add(t);
    if (e.imageKey) photoCount++;
  }

  result.early_bird = { current: Math.min(earlyCount, 5), target: 5 };
  result.night_owl = { current: Math.min(nightCount, 10), target: 10 };
  result.tag_master = { current: Math.min(uniqueTags.size, 20), target: 20 };
  result.photo_journal = { current: Math.min(photoCount, 25), target: 25 };

  const maxCalm = computeMaxCalmStreak(entries);
  result.zen_30 = { current: Math.min(maxCalm, 30), target: 30 };

  return result;
}

function computeMaxStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const sorted = [...dates].sort();
  let max = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      current++;
      if (current > max) max = current;
    } else {
      current = 1;
    }
  }
  return max;
}

function computeMaxCalmStreak(entries: EntryRow[]): number {
  const calmDays = new Set<string>();
  const nonCalmDays = new Set<string>();
  for (const e of entries) {
    if (e.moodTypeId === "neutral" || e.moodTypeId === "happy") {
      if (!nonCalmDays.has(e.date)) calmDays.add(e.date);
    } else {
      nonCalmDays.add(e.date);
      calmDays.delete(e.date);
    }
  }
  return computeMaxStreak(calmDays);
}
