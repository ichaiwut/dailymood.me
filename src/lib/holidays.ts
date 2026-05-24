import type { HolidayCacheEntry } from "@/db/schema";

interface RecurringHoliday {
  month: number;
  day: number;
  name: string;
  localName: string;
}

const THAI_HOLIDAYS: RecurringHoliday[] = [
  { month: 1, day: 1, name: "New Year's Day", localName: "วันขึ้นปีใหม่" },
  { month: 2, day: 10, name: "Chinese New Year", localName: "วันตรุษจีน" },
  { month: 2, day: 26, name: "Makha Bucha", localName: "วันมาฆบูชา" },
  { month: 4, day: 6, name: "Chakri Memorial Day", localName: "วันจักรี" },
  { month: 4, day: 13, name: "Songkran", localName: "วันสงกรานต์" },
  { month: 4, day: 14, name: "Songkran", localName: "วันสงกรานต์" },
  { month: 4, day: 15, name: "Songkran", localName: "วันสงกรานต์" },
  { month: 5, day: 1, name: "Labour Day", localName: "วันแรงงาน" },
  { month: 5, day: 4, name: "Coronation Day", localName: "วันฉัตรมงคล" },
  { month: 5, day: 12, name: "Visakha Bucha", localName: "วันวิสาขบูชา" },
  { month: 6, day: 3, name: "Queen Suthida's Birthday", localName: "วันเฉลิมพระชนมพรรษา พระราชินี" },
  { month: 7, day: 10, name: "Asanha Bucha", localName: "วันอาสาฬหบูชา" },
  { month: 7, day: 11, name: "Buddhist Lent Day", localName: "วันเข้าพรรษา" },
  { month: 7, day: 28, name: "King's Birthday", localName: "วันเฉลิมพระชนมพรรษา ร.10" },
  { month: 8, day: 12, name: "Mother's Day", localName: "วันแม่แห่งชาติ" },
  { month: 10, day: 13, name: "King Bhumibol Memorial Day", localName: "วันคล้ายวันสวรรคต ร.9" },
  { month: 10, day: 23, name: "Chulalongkorn Day", localName: "วันปิยมหาราช" },
  { month: 12, day: 5, name: "Father's Day", localName: "วันพ่อแห่งชาติ" },
  { month: 12, day: 10, name: "Constitution Day", localName: "วันรัฐธรรมนูญ" },
  { month: 12, day: 31, name: "New Year's Eve", localName: "วันสิ้นปี" },
];

export function getHolidaysForYear(year: number): HolidayCacheEntry[] {
  return THAI_HOLIDAYS.map((h) => ({
    date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    name: h.name,
    localName: h.localName,
  }));
}
