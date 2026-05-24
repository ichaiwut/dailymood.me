import { getDb } from "@/lib/cf";
import { personalEvents } from "@/db/schema";
import type { SpecialDay } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getHolidaysForYear } from "@/lib/holidays";
import { FREE_PERSONAL_EVENTS_LIMIT } from "@/lib/event-limits";

export { FREE_PERSONAL_EVENTS_LIMIT };

export async function getSpecialDaysForMonth(
  year: number,
  month: number,
  userId: string,
): Promise<SpecialDay[]> {
  const holidays = getHolidaysForYear(year);
  const events = await getDb()
    .select()
    .from(personalEvents)
    .where(and(eq(personalEvents.userId, userId), eq(personalEvents.month, month)));

  const mm = String(month).padStart(2, "0");
  const prefix = `${year}-${mm}`;

  const holidayDays: SpecialDay[] = holidays
    .filter((h) => h.date.startsWith(prefix))
    .map((h) => ({
      date: h.date,
      type: "holiday" as const,
      label: h.name,
      labelTh: h.localName,
      emoji: "🇹🇭",
    }));

  const personalDays: SpecialDay[] = events
    .filter((e) => {
      const d = new Date(year, month - 1, e.day);
      return d.getMonth() === month - 1;
    })
    .map((e) => ({
      date: `${year}-${mm}-${String(e.day).padStart(2, "0")}`,
      type: "personal" as const,
      label: e.label,
      labelTh: e.labelTh ?? undefined,
      emoji: e.emoji,
      id: e.id,
    }));

  return [...holidayDays, ...personalDays].sort((a, b) => a.date.localeCompare(b.date));
}
