"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";

export interface TimelineEntry {
  id: string;
  moodTypeId: string;
  note: string | null;
  aiSummary: string | null;
  tags: string[] | null;
  date: string;
  createdAt: string | number;
}

interface DayGroup {
  label: string;
  dateSuffix: string;
  entries: TimelineEntry[];
}

function groupEntriesByDate(entries: TimelineEntry[], locale: string): DayGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const bcp47 = locale === "th" ? "th-TH" : "en-US";

  const groups: Map<string, DayGroup> = new Map();

  for (const entry of entries) {
    const dateKey = entry.date;
    const [yStr, mStr, dStr] = entry.date.split("-");
    const entryDay = new Date(+yStr, +mStr - 1, +dStr);

    let label: string;
    let dateSuffix: string;

    if (entryDay.getTime() === today.getTime()) {
      label = "TODAY";
      dateSuffix = entryDay.toLocaleDateString(bcp47, { month: "short", day: "numeric" });
    } else if (entryDay.getTime() === yesterday.getTime()) {
      label = "YESTERDAY";
      dateSuffix = entryDay.toLocaleDateString(bcp47, { month: "short", day: "numeric" });
    } else {
      label = entryDay
        .toLocaleDateString(bcp47, { weekday: "short", month: "short", day: "numeric" })
        .toUpperCase();
      dateSuffix = "";
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { label, dateSuffix, entries: [] });
    }
    groups.get(dateKey)!.entries.push(entry);
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.entries[0].date.localeCompare(a.entries[0].date),
  );
}

interface TimelineFeedProps {
  entries: TimelineEntry[] | null;
  activeFilter: string;
  onFilterChange: (id: string) => void;
  locale: string;
  monthLabel: string;
}

export function TimelineFeed({
  entries,
  activeFilter,
  onFilterChange,
  locale,
  monthLabel,
}: TimelineFeedProps) {
  const t = useTranslations("calendar");

  const moodChips = useMemo(
    () => [
      { key: "all", label: t("filterAll"), emoji: "" },
      ...DEFAULT_MOODS.map((m) => ({
        key: m.id,
        label: locale === "th" ? m.labelTh : m.label,
        emoji: m.emoji,
      })),
    ],
    [locale, t],
  );

  const filtered = useMemo(() => {
    if (!entries) return null;
    if (activeFilter === "all") return entries;
    return entries.filter((e) => e.moodTypeId === activeFilter);
  }, [entries, activeFilter]);

  const dayGroups = useMemo(
    () => (filtered ? groupEntriesByDate(filtered, locale) : []),
    [filtered, locale],
  );

  return (
    <div className="fade-in">
      {/* ── Filter Chips ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-3">
        {moodChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onFilterChange(chip.key)}
            className="shrink-0"
            style={{
              padding: "8px 14px",
              borderRadius: 100,
              fontSize: 13,
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

      {/* ── Entry List ── */}
      {filtered === null ? (
        <div className="space-y-4 mt-2">
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      ) : dayGroups.length > 0 ? (
        <div className="space-y-6 mt-2">
          {dayGroups.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#A673F1",
                    letterSpacing: "0.5px",
                  }}
                >
                  {group.label}
                </span>
                {group.dateSuffix && (
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    · {group.dateSuffix}
                  </span>
                )}
              </div>
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
          {activeFilter !== "all"
            ? t("timelineFilterEmpty")
            : t("timelineEmpty", { month: monthLabel })}
        </div>
      )}
    </div>
  );
}

function EntryCard({ entry, locale }: { entry: TimelineEntry; locale: string }) {
  const router = useRouter();
  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const date = new Date(entry.createdAt);
  const time = date.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const title =
    entry.aiSummary ??
    (entry.note
      ? entry.note.split("\n")[0]
      : (locale === "th" ? mood?.labelTh : mood?.label) ?? "—");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/entry/${entry.id}` as "/")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/entry/${entry.id}` as "/");
        }
      }}
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between gap-2">
          <span
            className="line-clamp-1"
            style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", flex: 1, minWidth: 0 }}
          >
            {title}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}>{time}</span>
        </div>
        {entry.note && entry.aiSummary && (
          <p
            className="line-clamp-1"
            style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}
          >
            {entry.note}
          </p>
        )}
        {entry.note && !entry.aiSummary && entry.note.includes("\n") && (
          <p
            className="line-clamp-1"
            style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}
          >
            {entry.note.split("\n").slice(1).join(" ")}
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
