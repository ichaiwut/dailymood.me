"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import type { CalendarAiResult } from "@/db/schema";
import type { Tier } from "@/lib/tier";

interface Props {
  data: CalendarAiResult | null;
  loading: boolean;
  tier: Tier;
  monthLabel: string;
  tooFewEntries: boolean;
}

function emojiToIconUrl(emoji: string): string | null {
  const mood = DEFAULT_MOODS.find((m) => m.emoji === emoji);
  return mood?.iconUrl ?? null;
}

export function AiSummaryCard({ data, loading, tier, monthLabel, tooFewEntries }: Props) {
  const t = useTranslations("calendarAi");
  const isPremium = tier === "premium";

  if (loading) return <SummarySkeleton />;

  if (tooFewEntries && !data) {
    return (
      <div
        className="mb-6 fade-in"
        style={{
          borderRadius: 22,
          padding: "24px 20px",
          background: "var(--surface-2)",
          border: "1px solid var(--hairline)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
        <p style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 600 }}>
          {t("tooFewShort")}
        </p>
      </div>
    );
  }

  if (!data && isPremium) return null;

  if (!data) {
    return <FreeTeaser monthLabel={monthLabel} />;
  }

  const summary = isPremium ? data.summary : data.summaryFirstSentence;

  return (
    <div
      className="mb-6 fade-in"
      style={{
        borderRadius: 22,
        padding: "22px 20px 20px",
        background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 60%, #FFF4EB 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "#A673F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
          </svg>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.5px" }}>
          {t("summaryHeader", { month: monthLabel.toUpperCase() })}
        </span>
      </div>

      {/* Summary text */}
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: "var(--ink)",
          marginBottom: 16,
          ...(isPremium ? {} : {
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }),
        }}
      >
        <BoldMarkdown text={summary} />
      </p>

      {/* Highlight chips */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
        {data.highlights.bestDay && (
          <Chip
            iconUrl={emojiToIconUrl(data.highlights.bestDay.emoji)}
            emoji={data.highlights.bestDay.emoji}
            label={`${t("bestDay")} · ${formatChipDate(data.highlights.bestDay.date)}`}
          />
        )}
        {data.highlights.hardDay && (
          <Chip
            iconUrl={emojiToIconUrl(data.highlights.hardDay.emoji)}
            emoji={data.highlights.hardDay.emoji}
            label={`${t("hardestDay")} · ${formatChipDate(data.highlights.hardDay.date)}`}
          />
        )}
        {data.highlights.topTag && (
          <Chip emoji="☕" label={`${t("topTrigger")}`} sub={data.highlights.topTag} />
        )}
      </div>

      {/* CTA */}
      <Link
        href={"/insights" as "/"}
        className="flex items-center gap-1.5"
        style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", textDecoration: "none" }}
      >
        {t("tellMeMore")}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}

function Chip({ iconUrl, emoji, label, sub }: { iconUrl?: string | null; emoji: string; label: string; sub?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border: "1.5px solid #F2F0F5",
        borderRadius: 100,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--ink)",
      }}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="" width={20} height={20} style={{ flexShrink: 0 }} />
      ) : (
        <span style={{ fontSize: 16 }}>{emoji}</span>
      )}
      {label}
      {sub && <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{sub}</span>}
    </span>
  );
}

function BoldMarkdown({ text }: { text: string }) {
  const parts = text.split(/\*\*/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function formatChipDate(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FreeTeaser({ monthLabel }: { monthLabel: string }) {
  const t = useTranslations("calendarAi");
  return (
    <div
      className="mb-6 fade-in"
      style={{
        borderRadius: 22,
        padding: "22px 20px 20px",
        background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 60%, #FFF4EB 100%)",
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "#A673F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
          </svg>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.5px" }}>
          {t("summaryHeader", { month: monthLabel.toUpperCase() })}
        </span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 16 }}>
        {t("freeTeaser")}
      </p>
      <button
        style={{
          background: "#A673F1",
          color: "#fff",
          border: "none",
          borderRadius: 100,
          padding: "10px 20px",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {t("unlockPremium")}
      </button>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="mb-6 fade-in" style={{ borderRadius: 22, padding: "22px 20px", background: "var(--surface-2)", opacity: 0.6 }}>
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--hairline)" }} />
        <div style={{ width: 160, height: 12, borderRadius: 4, background: "var(--hairline)" }} />
      </div>
      <div style={{ height: 16, borderRadius: 4, background: "var(--hairline)", marginBottom: 10, width: "90%" }} />
      <div style={{ height: 16, borderRadius: 4, background: "var(--hairline)", marginBottom: 10, width: "75%" }} />
      <div className="flex gap-2 mt-4">
        <div style={{ height: 34, width: 130, borderRadius: 100, background: "var(--hairline)" }} />
        <div style={{ height: 34, width: 140, borderRadius: 100, background: "var(--hairline)" }} />
      </div>
    </div>
  );
}
