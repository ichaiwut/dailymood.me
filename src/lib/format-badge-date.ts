/**
 * Localized short date for achievement badges.
 * `{ year: true }` appends the year (Buddhist era for Thai) — used on the
 * detail sheet + share card; the grid stamp omits it.
 */
const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatBadgeDate(iso: string, locale: string, opts?: { year?: boolean }): string {
  const d = new Date(iso);
  if (locale === "th") {
    const base = `${d.getDate()} ${TH_MONTHS[d.getMonth()]}`;
    return opts?.year ? `${base} ${d.getFullYear() + 543}` : base;
  }
  const base = `${EN_MONTHS[d.getMonth()]} ${d.getDate()}`;
  return opts?.year ? `${base}, ${d.getFullYear()}` : base;
}
