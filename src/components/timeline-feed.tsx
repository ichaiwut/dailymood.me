"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";

export interface TimelineEntry {
  id: string;
  moodTypeId: string;
  note: string | null;
  aiSummary: string | null;
  tags: string[] | null;
  imageUrl: string | null;
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

  const moodChips = useMemo(
    () => [
      { key: "all", label: t("filterAll"), color: "", dot: false },
      ...DEFAULT_MOODS.map((m) => ({
        key: m.id,
        label: locale === "th" ? m.labelTh : m.label,
        color: m.color,
        dot: true,
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
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-4">
        {moodChips.map((chip) => (
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
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: activeFilter === chip.key ? "var(--ink)" : "var(--surface-2)",
              color: activeFilter === chip.key ? "#fff" : "var(--ink)",
              transition: "all 0.15s ease",
            }}
          >
            {chip.dot && (
              <span style={{ width: 8, height: 8, borderRadius: 100, background: chip.color, flexShrink: 0 }} />
            )}
            {chip.label}
          </button>
        ))}
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
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                  {group.relativeLabel}
                </span>
                {group.dateLabel && (
                  <span style={{ fontSize: 14, color: "var(--ink-3)", marginLeft: 6 }}>
                    · {group.dateLabel}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {group.entries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} locale={locale} pack={pack} iconFormat={iconFormat} />
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

function EntryCard({ entry, locale, pack, iconFormat }: { entry: TimelineEntry; locale: string; pack: string; iconFormat: string }) {
  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const date = new Date(entry.createdAt);
  const time = date.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/entry/${entry.id}` as "/"}
      className="block transition active:scale-[0.97] card"
      style={{
        padding: 16,
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: moodColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {mood && <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={24} height={24} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            {locale === "th" ? mood?.labelTh : mood?.label}
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
            {time}
          </div>
        </div>
      </div>
      {entry.imageUrl && (
        <img src={entry.imageUrl} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 10 }} />
      )}
      {entry.note && (
        <p className="line-clamp-2" style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>
          {entry.note}
        </p>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.slice(0, 3).map((tag, j) => (
            <span
              key={j}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#A673F1",
                background: "#F4EEFB",
                borderRadius: 8,
                padding: "2px 8px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function SkeletonGroup() {
  return (
    <div>
      <div style={{ height: 14, width: 120, background: "var(--surface-2)", borderRadius: 6, opacity: 0.6, marginBottom: 12 }} />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} style={{ background: "#fff", border: "1.5px solid var(--hairline)", borderRadius: 18, padding: 14, display: "flex", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 100, background: "var(--surface-2)", opacity: 0.6, flexShrink: 0 }} />
            <div className="flex-1 space-y-2 py-1">
              <div style={{ height: 14, width: "50%", background: "var(--surface-2)", borderRadius: 6, opacity: 0.6 }} />
              <div style={{ height: 14, width: "75%", background: "var(--surface-2)", borderRadius: 6, opacity: 0.4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
