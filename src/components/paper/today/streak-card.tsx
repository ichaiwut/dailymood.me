"use client";

/** Right-rail streak card — washi-taped paper with a 14-segment progress bar. */
export function StreakCard({ streak, locale }: { streak: number; locale: string }) {
  return (
    <div className="pa-sheet" style={{ borderRadius: 16, padding: "22px 22px 20px", position: "relative" }}>
      <span className="pa-washi" aria-hidden style={{ width: 96 }} />
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--w-ink-3)", textTransform: "uppercase", letterSpacing: ".08em", margin: "6px 0 10px" }}>STREAK</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--w-ink)" }}>{streak}</span>
        <span style={{ color: "var(--w-ink-3)", fontSize: 14, fontWeight: 700 }}>{locale === "th" ? "วันติดต่อกัน" : "consecutive days"}</span>
        <span aria-hidden style={{ marginLeft: "auto", fontSize: 30 }}>🔥</span>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 26, borderRadius: 5, background: i < streak ? "var(--peach)" : "var(--w-tint)" }} />
        ))}
      </div>
    </div>
  );
}
