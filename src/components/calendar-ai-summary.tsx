"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";
import type { CalendarAiResult } from "@/db/schema";
import type { Tier } from "@/lib/tier";
import { AiDisclaimer } from "./ai-disclaimer";

interface Props {
  data: CalendarAiResult | null;
  loading: boolean;
  tier: Tier;
  monthLabel: string;
  tooFewEntries: boolean;
  pack?: string;
  iconFormat?: string;
}

function emojiToIconUrl(emoji: string, pack: string, iconFormat: string): string | null {
  const mood = DEFAULT_MOODS.find((m) => m.emoji === emoji);
  return mood ? moodIconUrl(mood.id, pack, iconFormat) : null;
}

const SparkleSquare = () => (
  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, var(--purple), #C9A6F5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
);

export function AiSummaryCard({ data, loading, tier, monthLabel, tooFewEntries, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: Props) {
  const t = useTranslations("calendarAi");
  const isPremium = tier === "premium";

  if (loading) return <SummarySkeleton />;

  if (tooFewEntries && !data) {
    return (
      <div className="pa-sheet mb-6 fade-in" style={{ borderRadius: 16, padding: "24px 20px", background: "#FBF7F0", border: "1.5px dashed var(--w-rule-strong)", boxShadow: "none", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
        <p style={{ fontSize: 14, color: "var(--w-ink-2)", fontWeight: 600 }}>{t("tooFewShort")}</p>
      </div>
    );
  }

  if (!data && isPremium) return null;
  if (!data) return <FreeTeaser monthLabel={monthLabel} />;

  const summary = isPremium ? data.summary : data.summaryFirstSentence;

  return (
    <div className="pa-sheet mb-6 fade-in" style={{ borderRadius: 18, padding: "22px 22px 20px", background: "linear-gradient(135deg, #F1E7FA, #F8EDEB)", position: "relative" }}>
      <span className="pa-washi yellow" aria-hidden style={{ width: 96 }} />
      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginTop: 6, marginBottom: 14 }}>
        <SparkleSquare />
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", letterSpacing: "0.3px" }}>
          {t("summaryHeader", { month: monthLabel.toUpperCase() })}
        </span>
      </div>

      {/* Summary text */}
      <p
        style={{
          fontSize: 15, lineHeight: 1.65, color: "var(--w-ink)", marginBottom: 16,
          ...(isPremium ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
        }}
      >
        <BoldMarkdown text={summary} />
      </p>

      {/* Highlight chips */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
        {data.highlights.bestDay && (
          <Chip iconUrl={emojiToIconUrl(data.highlights.bestDay.emoji, pack, iconFormat)} emoji={data.highlights.bestDay.emoji} label={`${t("bestDay")} · ${formatChipDate(data.highlights.bestDay.date)}`} />
        )}
        {data.highlights.hardDay && (
          <Chip iconUrl={emojiToIconUrl(data.highlights.hardDay.emoji, pack, iconFormat)} emoji={data.highlights.hardDay.emoji} label={`${t("hardestDay")} · ${formatChipDate(data.highlights.hardDay.date)}`} />
        )}
        {data.highlights.topTag && (
          <Chip emoji="☕" label={`${t("topTrigger")}`} sub={data.highlights.topTag} />
        )}
      </div>

      {/* CTA */}
      <Link href={"/insights" as "/"} className="flex items-center gap-1.5" style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", textDecoration: "none" }}>
        {t("tellMeMore")}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>

      <div style={{ marginTop: 12 }}><AiDisclaimer variant="analysis" /></div>
    </div>
  );
}

function Chip({ iconUrl, emoji, label, sub }: { iconUrl?: string | null; emoji: string; label: string; sub?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.72)", borderRadius: 100, padding: "7px 14px", fontSize: 14, fontWeight: 700, color: "var(--w-ink)" }}>
      {iconUrl ? <img src={iconUrl} alt="" width={20} height={20} style={{ flexShrink: 0 }} /> : <span style={{ fontSize: 16 }}>{emoji}</span>}
      {label}
      {sub && <span style={{ fontWeight: 600, color: "var(--w-ink-2)" }}>{sub}</span>}
    </span>
  );
}

function BoldMarkdown({ text }: { text: string }) {
  const parts = text.split(/\*\*/);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>))}
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
    <div className="pa-sheet mb-6 fade-in" style={{ borderRadius: 18, padding: "22px 22px 20px", background: "linear-gradient(135deg, #F1E7FA, #F8EDEB)", position: "relative" }}>
      <span className="pa-washi yellow" aria-hidden style={{ width: 96 }} />
      <div className="flex items-center gap-2" style={{ marginTop: 6, marginBottom: 10 }}>
        <SparkleSquare />
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", letterSpacing: "0.3px" }}>
          {t("summaryHeader", { month: monthLabel.toUpperCase() })}
        </span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--w-ink-2)", marginBottom: 16 }}>{t("freeTeaser")}</p>
      <Link href={"/pricing" as "/"} className="pa-btn purple" style={{ height: 40, textDecoration: "none" }}>{t("unlockPro")}</Link>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="pa-sheet mb-6 fade-in" style={{ borderRadius: 18, padding: "22px 20px", opacity: 0.6 }}>
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--w-tint)" }} />
        <div style={{ width: 160, height: 12, borderRadius: 4, background: "var(--w-tint)" }} />
      </div>
      <div style={{ height: 16, borderRadius: 4, background: "var(--w-tint)", marginBottom: 10, width: "90%" }} />
      <div style={{ height: 16, borderRadius: 4, background: "var(--w-tint)", marginBottom: 10, width: "75%" }} />
      <div className="flex gap-2 mt-4">
        <div style={{ height: 34, width: 130, borderRadius: 100, background: "var(--w-tint)" }} />
        <div style={{ height: 34, width: 140, borderRadius: 100, background: "var(--w-tint)" }} />
      </div>
    </div>
  );
}
