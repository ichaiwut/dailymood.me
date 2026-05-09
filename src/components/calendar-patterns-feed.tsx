"use client";

import { useTranslations } from "next-intl";
import type { CalendarAiResult } from "@/db/schema";
import type { Tier } from "@/lib/tier";

interface Props {
  patterns: CalendarAiResult["patterns"];
  tier: Tier;
}

export function PatternsFeed({ patterns, tier }: Props) {
  const t = useTranslations("calendarAi");
  const isPremium = tier === "premium";

  if (!isPremium) {
    return (
      <div style={{ marginTop: 12, marginBottom: 12 }} className="fade-in">
        <div className="flex items-center gap-1.5" style={{ marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="#A673F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#A673F1", letterSpacing: "0.5px" }}>
            {t("patternsTitle")}
          </span>
        </div>
        <div
          style={{
            borderRadius: 18,
            padding: "28px 20px",
            background: "var(--surface-2)",
            border: "1px solid var(--hairline)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
            {t("patternsLocked")}
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-2)" }}>
            {t("patternsLockedBody")}
          </p>
        </div>
      </div>
    );
  }

  const displayPatterns = patterns.filter((p) => p.type !== "best");
  if (!displayPatterns || displayPatterns.length === 0) return null;

  const BG_COLORS = ["#F4EBFE", "#FDE8DA", "#E8F4FD", "#F0FDF4"];

  return (
    <div style={{ marginTop: 12, marginBottom: 12 }} className="fade-in">
      <div className="flex items-center gap-1.5" style={{ marginBottom: 12 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="#A673F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#A673F1", letterSpacing: "0.5px" }}>
          {t("patternsTitle")}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {displayPatterns.map((p, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: "18px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 100,
                background: BG_COLORS[i % BG_COLORS.length],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 24,
              }}
            >
              {p.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>
                {p.explanation}
              </p>
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#A673F1",
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
                flexShrink: 0,
                paddingTop: 4,
              }}
            >
              {t("view")} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
