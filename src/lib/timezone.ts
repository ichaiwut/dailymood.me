const ICT_OFFSET_MS = 7 * 3600_000;

export function nowICT(): Date {
  return new Date(Date.now() + ICT_OFFSET_MS);
}

export function toICT(d: Date): Date {
  return new Date(d.getTime() + ICT_OFFSET_MS);
}

export function ymdICT(d: Date = new Date()): string {
  const ict = new Date(d.getTime() + ICT_OFFSET_MS);
  return `${ict.getUTCFullYear()}-${String(ict.getUTCMonth() + 1).padStart(2, "0")}-${String(ict.getUTCDate()).padStart(2, "0")}`;
}

export function todayICT(): string {
  return ymdICT(new Date());
}

export function ictHour(d: Date = new Date()): number {
  const ict = new Date(d.getTime() + ICT_OFFSET_MS);
  return ict.getUTCHours();
}

export function ictDayOfWeek(d: Date = new Date(), locale: "en" | "th" = "en", format: "long" | "short" = "long"): string {
  const ict = new Date(d.getTime() + ICT_OFFSET_MS);
  const day = ict.getUTCDay();
  if (format === "short") {
    const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const th = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    return locale === "th" ? th[day] : en[day];
  }
  const en = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const th = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
  return locale === "th" ? th[day] : en[day];
}

export function ictYear(d: Date = new Date()): number {
  const ict = new Date(d.getTime() + ICT_OFFSET_MS);
  return ict.getUTCFullYear();
}

export function ictMonth(d: Date = new Date()): number {
  const ict = new Date(d.getTime() + ICT_OFFSET_MS);
  return ict.getUTCMonth() + 1;
}

export function midnightICTinUTC(): Date {
  const now = new Date();
  const ict = new Date(now.getTime() + ICT_OFFSET_MS);
  const nextMidnightICT = new Date(Date.UTC(ict.getUTCFullYear(), ict.getUTCMonth(), ict.getUTCDate() + 1, 0, 0, 0));
  return new Date(nextMidnightICT.getTime() - ICT_OFFSET_MS);
}
