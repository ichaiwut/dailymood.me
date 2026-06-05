"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { EntryFolderCard } from "./paper/today/entry-folder-card";

export interface TimelineEntry {
  id: string;
  moodTypeId: string;
  note: string | null;
  aiSummary: string | null;
  tags: string[] | null;
  activityId?: string | null;
  activityEmoji?: string | null;
  imageUrl: string | null;
  location: string | null;
  date: string;
  createdAt: string | number;
}

interface DayGroup {
  relativeLabel: string;
  dateLabel: string;
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

    const weekday = entryDay.toLocaleDateString(bcp47, { weekday: "long" });
    const dayMonth = entryDay.toLocaleDateString(bcp47, { day: "numeric", month: "short" });

    let relativeLabel: string;
    let dateLabel: string;

    if (entryDay.getTime() === today.getTime()) {
      relativeLabel = locale === "th" ? "วันนี้" : "Today";
      dateLabel = `${weekday} ${dayMonth}`;
    } else if (entryDay.getTime() === yesterday.getTime()) {
      relativeLabel = locale === "th" ? "เมื่อวาน" : "Yesterday";
      dateLabel = `${weekday} ${dayMonth}`;
    } else {
      relativeLabel = `${weekday} ${dayMonth}`;
      dateLabel = "";
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { relativeLabel, dateLabel, entries: [] });
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
  pack?: string;
  iconFormat?: string;
}

function entryTab(createdAt: string | number, th: boolean): { label: string; variant: "" | "mint" | "lav" } {
  const h = new Date(createdAt).getHours();
  if (h < 12) return { label: th ? "เช้า" : "Morning", variant: "" };
  if (h < 17) return { label: th ? "บ่าย" : "Afternoon", variant: "mint" };
  return { label: th ? "เย็น" : "Evening", variant: "lav" };
}

export function TimelineFeed({
  entries,
  activeFilter,
  onFilterChange,
  locale,
  monthLabel,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
}: TimelineFeedProps) {
  const t = useTranslations("calendar");
  const th = locale === "th";

  const moodChips = useMemo(
    () => [
      { key: "all", label: t("filterAll"), color: "", dot: false },
      ...DEFAULT_MOODS.map((m) => ({
        key: m.id,
        label: th ? m.labelTh : m.label,
        color: m.color,
        dot: true,
      })),
    ],
    [th, t],
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
      {/* ── Filter Chips (paper) ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-4">
        {moodChips.map((chip) => {
          const active = activeFilter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => onFilterChange(chip.key)}
              className="shrink-0"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                background: active ? "var(--w-ink)" : "var(--w-surface)",
                color: active ? "var(--bg)" : "var(--w-ink)",
                boxShadow: active ? "0 6px 0 -2px #000" : "0 5px 14px -8px rgba(60,40,20,.4)",
              }}
            >
              {chip.dot && (
                <span style={{ width: 8, height: 8, borderRadius: 100, background: chip.color, flexShrink: 0 }} />
              )}
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* ── Entry List ── */}
      {filtered === null ? (
        <div className="space-y-6 mt-2">
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      ) : dayGroups.length > 0 ? (
        <div className="space-y-8 mt-2">
          {dayGroups.map((group, gi) => (
            <div key={gi}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--w-ink)" }}>{group.relativeLabel}</span>
                {group.dateLabel && (
                  <span style={{ fontSize: 14, color: "var(--w-ink-3)", marginLeft: 6 }}>· {group.dateLabel}</span>
                )}
              </div>
              <div className="pa-entries-grid">
                {group.entries.map((entry, i) => {
                  const tab = entryTab(entry.createdAt, th);
                  const m = DEFAULT_MOODS.find((mm) => mm.id === entry.moodTypeId);
                  const mood = m ? { id: m.id, color: m.color, label: m.label, labelTh: m.labelTh, iconKey: null } : undefined;
                  return (
                    <EntryFolderCard
                      key={entry.id}
                      entry={entry}
                      mood={mood}
                      locale={locale}
                      pack={pack}
                      iconFormat={iconFormat}
                      tabLabel={tab.label}
                      tabVariant={tab.variant}
                      rotation={i % 2 ? 0.6 : -0.6}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16" style={{ color: "var(--w-ink-3)", fontSize: 15 }}>
          {activeFilter !== "all"
            ? t("timelineFilterEmpty")
            : t("timelineEmpty", { month: monthLabel })}
        </div>
      )}
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div>
      <div style={{ height: 14, width: 120, background: "var(--w-tint)", borderRadius: 6, opacity: 0.6, marginBottom: 14 }} />
      <div className="pa-entries-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="pa-sheet" style={{ height: 150, opacity: 0.5 }} />
        ))}
      </div>
    </div>
  );
}
