"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";

interface Entry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  createdAt: string | number;
}

interface DayGroup {
  label: string;
  dateSuffix: string;
  entries: Entry[];
}

const FILTER_CHIPS = [
  { key: "all", label: "All", emoji: "" },
  { key: "happy", label: "Happy", emoji: "😄" },
  { key: "sad", label: "Sad", emoji: "😔" },
  { key: "work", label: "Work", emoji: "💼" },
  { key: "friends", label: "Friends", emoji: "🤝" },
  { key: "rain", label: "Rain", emoji: "🌧" },
];

function groupEntriesByDate(entries: Entry[], locale: string): DayGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups: Map<string, DayGroup> = new Map();

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let label: string;
    let dateSuffix: string;

    if (entryDay.getTime() === today.getTime()) {
      label = "TODAY";
      dateSuffix = d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
        month: "short",
        day: "numeric",
      });
    } else if (entryDay.getTime() === yesterday.getTime()) {
      label = "YESTERDAY";
      dateSuffix = d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      label = d
        .toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
        .toUpperCase();
      dateSuffix = "";
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { label, dateSuffix, entries: [] });
    }
    groups.get(dateKey)!.entries.push(entry);
  }

  return Array.from(groups.values());
}

export function HistoryShell() {
  const locale = useLocale();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    fetch("/api/log")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => {
        if (alive) setEntries((data as { entries: Entry[] }).entries);
      });
    return () => {
      alive = false;
    };
  }, []);

  const totalEntries = entries?.length ?? 0;
  const dayGroups = entries ? groupEntriesByDate(entries, locale) : [];

  return (
    <>
      {/* ── HEADER ─── */}
      <header className="flex items-center justify-between pt-4 pb-3 fade-in">
        <div>
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
            {totalEntries} {locale === "th" ? "รายการ" : "entries"}
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
            {locale === "th" ? "Timeline" : "Timeline"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="icon-btn" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button className="icon-btn" aria-label="Filter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── FILTER CHIPS ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "40ms" }}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-2">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setActiveFilter(chip.key)}
              className="shrink-0"
              style={{
                padding: "8px 14px",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: activeFilter === chip.key ? "#0A0A0A" : "#F8F6FB",
                color: activeFilter === chip.key ? "#fff" : "#0A0A0A",
                transition: "all 0.15s ease",
              }}
            >
              {chip.emoji ? `${chip.emoji} ${chip.label}` : chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── ENTRY LIST ─── */}
      <section className="fade-in" style={{ animationDelay: "80ms" }}>
        {entries === null ? (
          <div className="space-y-4">
            <SkeletonGroup />
            <SkeletonGroup />
          </div>
        ) : dayGroups.length > 0 ? (
          <div className="space-y-6">
            {dayGroups.map((group, gi) => (
              <div key={gi}>
                {/* Day label */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#A673F1",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {group.label}
                  </span>
                  {group.dateSuffix && (
                    <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
                      {group.dateSuffix}
                    </span>
                  )}
                </div>

                {/* Entry cards */}
                <div className="space-y-3">
                  {group.entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} locale={locale} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16"
            style={{ color: "var(--ink-3)", fontSize: 15 }}
          >
            {locale === "th" ? "ยังไม่มีรายการ" : "No entries yet"}
          </div>
        )}
      </section>
    </>
  );
}

/* ─── Entry card ─── */

function EntryCard({ entry, locale }: { entry: Entry; locale: string }) {
  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const date = new Date(entry.createdAt);
  const time = date.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const moodLabel = locale === "th" ? mood?.labelTh : mood?.label;

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #F2F0F5",
        borderRadius: 22,
        padding: 14,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        cursor: "pointer",
      }}
    >
      {/* Mood emoji square */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: mood?.color ?? "#F4F2F7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {mood?.emoji ?? "·"}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
            {moodLabel ?? "Unknown"}
          </span>
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{time}</span>
        </div>
        {entry.note && (
          <p
            className="line-clamp-1"
            style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 2 }}
          >
            {entry.note}
          </p>
        )}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {entry.tags.slice(0, 5).map((tag, j) => (
              <span key={j} style={{ fontSize: 14 }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Skeletons ─── */

function SkeletonGroup() {
  return (
    <div>
      <div
        style={{
          height: 10,
          width: 80,
          background: "var(--surface-2)",
          borderRadius: 6,
          opacity: 0.6,
          marginBottom: 12,
        }}
      />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1.5px solid #F2F0F5",
              borderRadius: 22,
              padding: 14,
              display: "flex",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: "var(--surface-2)",
                opacity: 0.6,
                flexShrink: 0,
              }}
            />
            <div className="flex-1 space-y-2 py-1">
              <div
                style={{
                  height: 12,
                  width: "50%",
                  background: "var(--surface-2)",
                  borderRadius: 6,
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "75%",
                  background: "var(--surface-2)",
                  borderRadius: 6,
                  opacity: 0.4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
