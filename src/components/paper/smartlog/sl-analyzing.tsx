"use client";

/** Smart Log — dedicated full-modal "AI is analyzing" state. The ring respects
 *  prefers-reduced-motion (it simply stops spinning; the brain + steps stay
 *  visible). `aiStep` (0|1|2) is owned by the parent and drives the step chips. */
export function SLAnalyzing({ locale, aiStep }: { locale: string; aiStep: number }) {
  const steps: [string, string, string][] = [
    [locale === "th" ? "ตรวจอารมณ์" : "Mood check", "#1F8B6A", "var(--mint)"],
    [locale === "th" ? "จับ trigger" : "Triggers", "var(--purple-strong)", "var(--lavender)"],
    [locale === "th" ? "สรุปสั้น" : "Summary", "var(--w-ink-3)", "var(--w-tint)"],
  ];

  return (
    <div className="fade-in" style={{ padding: "34px 40px 46px", textAlign: "center" }}>
      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 22px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid var(--w-tint)" }} />
        <div
          className="sl-spinner"
          style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid transparent", borderTopColor: "var(--purple-strong)", borderRightColor: "var(--peach)" }}
        />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46 }} aria-hidden>🧠</div>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", color: "var(--w-ink)" }}>
        {locale === "th" ? "AI กำลังวิเคราะห์..." : "AI is analyzing..."}
      </h2>
      <p style={{ fontSize: 14, color: "var(--w-ink-3)", margin: "0 0 26px", lineHeight: 1.55 }}>
        {locale === "th"
          ? "กำลังอ่านข้อความและจับ trigger — ใช้เวลาประมาณ 2-3 วินาที"
          : "Reading your text and detecting triggers — about 2-3 seconds"}
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        {steps.map(([label, fg, bg], i) => {
          const done = aiStep > i;
          const activeStep = aiStep === i;
          const mark = done ? "✓" : activeStep ? "●" : "○";
          return (
            <span key={label} className="pa-chip" style={{ color: fg, background: bg, fontSize: 12 }}>
              {mark} {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
