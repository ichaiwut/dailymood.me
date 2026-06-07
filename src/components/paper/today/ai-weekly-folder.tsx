"use client";

import { Link } from "@/i18n/navigation";

type Tier = "guest" | "free" | "premium";

/** Right-rail "AI · สัปดาห์นี้" dark plum folder. Always shown (teaser for free,
 *  cached insight for premium) — never hidden behind a premium check. */
export function AiWeeklyFolder({
  tier,
  locale,
  insight,
}: {
  tier: Tier;
  locale: string;
  insight: { headline: string; summary: string } | null;
}) {
  return (
    <div style={{ position: "relative" }}>
      <span className="pa-tab ink" style={{ fontSize: 12, padding: "8px 16px 10px" }}>✦ AI · {locale === "th" ? "สัปดาห์นี้" : "This week"}</span>
      <div className="pa-sheet" style={{ borderRadius: "4px 16px 16px 16px", background: "linear-gradient(155deg,#2A1F33,#1A1320)", color: "#fff", padding: "22px 22px 24px", overflow: "hidden", position: "relative" }}>
        <div aria-hidden style={{ position: "absolute", top: -36, right: -36, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, var(--peach), transparent 70%)", opacity: 0.4 }} />
        {tier !== "premium" && (
          <span style={{ position: "absolute", top: 18, right: 20, background: "rgba(255,255,255,.16)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 100, letterSpacing: ".04em" }}>PRO</span>
        )}
        <div style={{ position: "relative", maxWidth: "88%" }}>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.92)" }}>
            {insight && tier === "premium" ? (
              <span style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{insight.summary}</span>
            ) : insight ? (
              <span>{insight.headline}</span>
            ) : (
              locale === "th"
                ? "AI สรุปอารมณ์ประจำสัปดาห์ วิเคราะห์ pattern และแนะนำสิ่งที่ช่วยให้ดีขึ้น"
                : "Weekly mood summary, pattern analysis, and personalized suggestions"
            )}
          </div>
        </div>
        <Link
          href={(tier === "premium" ? "/insights" : "/pricing") as "/"}
          style={{ position: "relative", marginTop: 18, display: "inline-block", background: "var(--w-surface)", color: "var(--w-ink)", border: "none", padding: "10px 18px", borderRadius: 11, fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 5px 0 -1px rgba(255,255,255,.35)" }}
        >
          {tier === "premium"
            ? (locale === "th" ? "เปิด AI Insights →" : "Open AI Insights →")
            : (locale === "th" ? "อัปเกรด Pro →" : "Upgrade to Pro →")}
        </Link>
      </div>
    </div>
  );
}
