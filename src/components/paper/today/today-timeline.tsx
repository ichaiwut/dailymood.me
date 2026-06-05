"use client";

import type { TodayEntry } from "./types";

/** "วันนี้" section header + the day-axis timeline sheet with mood dots. */
export function TodayTimeline({
  locale,
  todayEntries,
  entryCount,
  moodColors,
}: {
  locale: string;
  todayEntries: TodayEntry[];
  entryCount: number;
  moodColors: { id: string; color: string }[];
}) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "var(--w-ink)" }}>
          {locale === "th" ? "วันนี้" : "Today"}
        </h2>
        <span className="pa-chip" style={{ fontSize: 12 }}>
          📌 {entryCount} {locale === "th" ? "รายการ" : entryCount === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="pa-sheet" style={{ borderRadius: 16, padding: "20px 26px 24px", position: "relative" }}>
        <span className="pa-washi yellow" aria-hidden style={{ width: 92, left: 34, transform: "translateX(0) rotate(-3deg)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--w-ink-3)", fontWeight: 800, marginBottom: 10, marginTop: 6 }}>
          {["6:00", "9:00", "12:00", "15:00", "18:00", "21:00"].map((t) => <span key={t}>{t}</span>)}
        </div>
        <div style={{ height: 5, background: "var(--w-tint)", borderRadius: 100, position: "relative" }}>
          {todayEntries.slice(0, 8).map((e, i) => {
            const h = new Date(e.createdAt).getHours();
            const p = Math.min(92, Math.max(3, ((h - 6) / 15) * 100));
            const mood = moodColors.find((m) => m.id === e.moodTypeId);
            return (
              <div
                key={i}
                aria-hidden
                style={{ position: "absolute", left: `${p}%`, top: -7, width: 18, height: 18, borderRadius: "50%", background: mood?.color ?? "var(--w-ink-3)", border: "3px solid #fff", boxShadow: "0 3px 8px rgba(60,40,20,.25)", transform: "translateX(-50%)" }}
              />
            );
          })}
          <div style={{ position: "absolute", right: 0, top: -30, padding: "3px 11px", borderRadius: 100, background: "var(--purple)", color: "#fff", fontSize: 10, fontWeight: 800 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#fff", marginRight: 5 }} />
            {locale === "th" ? "ตอนนี้" : "Now"}
          </div>
        </div>
      </div>
    </div>
  );
}
