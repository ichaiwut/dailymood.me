"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { SmartLogModal } from "./smart-log-modal";

type Tier = "guest" | "free" | "premium";

interface Entry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  aiSource?: string;
  createdAt: string | number;
}

interface Stats {
  streak: number;
  todayMood: { moodId: string; createdAt: number } | null;
  last7: { date: string; moodId: string | null }[];
  distribution: Record<string, number>;
  total30d: number;
}

export function HomeShell({
  tier,
  pack = DEFAULT_MOOD_PACK,
}: {
  tier: Tier;
  pack?: string;
}) {
  const t = useTranslations("home");
  const locale = useLocale();

  const [logMoodId, setLogMoodId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/log").then((r) => (r.ok ? r.json() : { entries: [] })),
      fetch("/api/stats").then((r) =>
        r.ok
          ? r.json()
          : { streak: 0, todayMood: null, last7: [], distribution: {}, total30d: 0 },
      ),
    ]).then(([logData, statsData]) => {
      if (!alive) return;
      setEntries((logData as { entries: Entry[] }).entries);
      setStats(statsData as Stats);
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const streak = stats?.streak ?? 0;

  return (
    <>
      {/* ── STREAK STRIP ─── */}
      <section className="mb-5 fade-in">
        <div
          style={{
            background: "linear-gradient(135deg, #A673F1 0%, #C89BF5 100%)",
            borderRadius: 24,
            padding: "18px 20px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 14px 30px rgba(166,115,241,0.32)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            🔥
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {locale === "th" ? "คุณ streak อยู่" : "You're on a streak"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>
              {streak} {locale === "th" ? "วันติดต่อกัน" : "days strong"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 26,
                  borderRadius: 4,
                  background: i < streak % 7 || streak >= 7
                    ? "#fff"
                    : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── AI COMPOSER CARD ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "40ms" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 28,
            padding: 22,
            border: "1.5px solid #F0EAF7",
            boxShadow: "0 10px 30px rgba(166,115,241,0.10)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              background: "radial-gradient(circle, rgba(166,115,241,0.18), transparent 70%)",
            }}
          />
          <div className="flex items-center gap-2 mb-3.5" style={{ position: "relative" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#A673F1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#A673F1",
                letterSpacing: "0.3px",
              }}
            >
              AI MOOD ASSISTANT
            </span>
          </div>

          <button
            onClick={() => setLogMoodId("neutral")}
            className="w-full text-left"
            style={{
              fontSize: 17,
              lineHeight: 1.45,
              color: "var(--ink-3)",
              minHeight: 48,
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            {t("smartLogHint")}
            <span className="caret" />
          </button>

          <div className="flex gap-2.5 mt-4">
            <button
              className="icon-btn"
              aria-label="Voice"
              onClick={() => setLogMoodId("neutral")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10a7 7 0 01-14 0M12 19v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="icon-btn"
              aria-label="Camera"
              onClick={() => setLogMoodId("neutral")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => setLogMoodId("neutral")}
              style={{
                flex: 1,
                height: 48,
                background: "#0A0A0A",
                color: "#fff",
                border: "none",
                borderRadius: 24,
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {t("saveMood")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── MOOD PICKER ROW ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>
            {locale === "th" ? "หรือแตะเลือกอารมณ์" : "Or just tap a mood"}
          </h2>
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {stats?.total30d ?? 0} {locale === "th" ? "รายการ" : "logged"}
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-2">
          {DEFAULT_MOODS.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setLogMoodId(m.id)}
              aria-label={locale === "th" ? m.labelTh : m.label}
              className="shrink-0 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
              style={{
                width: 76,
                height: 96,
                background: m.color,
                borderRadius: 22,
                fontWeight: 700,
                color: "#0A0A0A",
                fontSize: 13,
                boxShadow: i === 0
                  ? `0 0 0 3px #fff, 0 0 0 5px ${m.color}, 0 10px 20px rgba(252,164,91,0.3)`
                  : "0 6px 14px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ fontSize: 30 }}>{m.emoji}</span>
              <span>{locale === "th" ? m.labelTh : m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── RECENT ENTRIES ─── */}
      <section className="fade-in pb-28" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>
            {t("todayEntries")}
          </h2>
          <span
            style={{ fontSize: 13, color: "#A673F1", fontWeight: 700, cursor: "pointer" }}
          >
            {t("seeAll")} →
          </span>
        </div>

        {entries === null ? (
          <div className="space-y-3">
            <SkeletonEntry />
            <SkeletonEntry />
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-0">
            {entries.map((e, i) => (
              <EntryRow key={e.id} entry={e} locale={locale} isFirst={i === 0} />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-10"
            style={{ color: "var(--ink-3)", fontSize: 15 }}
          >
            {t("emptyTitle")}
          </div>
        )}
      </section>

      {/* ── SMART LOG MODAL ─── */}
      {logMoodId && (
        <SmartLogModal
          tier={tier}
          pack={pack}
          preSelectedMoodId={logMoodId}
          onClose={() => setLogMoodId(null)}
          onSaved={() => {
            setLogMoodId(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}

/* ─── Entry row ─── */

function EntryRow({
  entry,
  locale,
  isFirst,
}: {
  entry: Entry;
  locale: string;
  isFirst: boolean;
}) {
  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const date = new Date(entry.createdAt);
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const dayLabel = date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="flex gap-3.5 py-3.5"
      style={{ borderTop: isFirst ? "none" : "1px solid #F2F0F5" }}
    >
      <div
        className="shrink-0 grid place-items-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: mood?.color ?? "#F4F2F7",
          fontSize: 28,
        }}
      >
        {mood?.emoji ?? "·"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
            {dayLabel} · {locale === "th" ? mood?.labelTh : mood?.label}
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{time}</span>
        </div>
        {entry.note && (
          <p className="line-clamp-1" style={{ fontSize: 13, color: "#5A5A5A" }}>
            {entry.note}
          </p>
        )}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {entry.tags.slice(0, 4).map((tag, j) => (
              <span key={j} style={{ fontSize: 14 }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── skeletons ─── */

function SkeletonEntry() {
  return (
    <div className="flex gap-3.5 py-3.5">
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: "var(--surface-2)",
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
      <div className="flex-1 space-y-2 py-2">
        <div style={{ height: 12, width: "60%", background: "var(--surface-2)", borderRadius: 6, opacity: 0.6 }} />
        <div style={{ height: 10, width: "80%", background: "var(--surface-2)", borderRadius: 6, opacity: 0.4 }} />
      </div>
    </div>
  );
}
