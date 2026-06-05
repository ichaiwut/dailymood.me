"use client";

import { Link } from "@/i18n/navigation";

/** Right-rail mini calendar folder. Past days get a rotating palette colour;
 *  today is ringed. (Colouring is date-based, matching the prior dashboard.) */
export function MiniCalendarFolder({ locale }: { locale: string }) {
  const now = new Date();
  const today = now.getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const palette = ["var(--peach)", "var(--yellow)", "var(--mint)", "var(--lavender)", "var(--blue)", "var(--purple)"];
  const monthYear = now.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long", year: "numeric" });
  const weekdays = locale === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div style={{ position: "relative" }}>
      <span className="pa-tab mint" style={{ fontSize: 12, padding: "8px 16px 10px" }}>{monthYear}</span>
      <div className="pa-sheet" style={{ borderRadius: "4px 16px 16px 16px", padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 12 }}>
          <Link href={"/calendar" as "/"} style={{ fontSize: 14, color: "var(--purple-strong)", textDecoration: "none", fontWeight: 800 }}>
            {locale === "th" ? "ดูทั้งหมด →" : "View all →"}
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
          {weekdays.map((d, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 800, color: "var(--w-ink-3)", textAlign: "center" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {Array.from({ length: 42 }).map((_, i) => {
            const d = i - firstDay + 1;
            if (d < 1 || d > daysInMonth) return <div key={i} />;
            const isToday = d === today;
            const filled = d <= today;
            const c = filled ? palette[(d * 3) % palette.length] : "var(--w-tint)";
            return (
              <div
                key={i}
                style={{
                  aspectRatio: "1", borderRadius: 8,
                  background: isToday ? "#fff" : c,
                  border: isToday ? "2.5px solid var(--purple)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                  color: filled && !isToday ? "#fff" : "var(--w-ink-2)",
                }}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
