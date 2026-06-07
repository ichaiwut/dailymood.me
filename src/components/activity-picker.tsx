"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";

interface ActivityRow {
  id: string;
  emoji: string;
  label: string;
  labelTh: string | null;
  isDefault: boolean;
}

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  activities?: ActivityRow[];
  compact?: boolean;
}

export function ActivityPicker({ value, onChange, activities: activitiesProp, compact }: Props) {
  const locale = useLocale();
  const [fetched, setFetched] = useState<ActivityRow[]>([]);
  const activities = activitiesProp ?? fetched;

  useEffect(() => {
    if (activitiesProp) return;
    fetch("/api/activities")
      .then((r) => r.ok ? r.json() : { activities: [] })
      .then((d) => setFetched((d as { activities: ActivityRow[] }).activities));
  }, [activitiesProp]);

  const toggle = useCallback((id: string) => {
    onChange(value === id ? null : id);
  }, [value, onChange]);

  if (activities.length === 0) return null;

  return (
    <div style={{ marginBottom: compact ? 0 : 14 }}>
      {!compact && (
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>
          {locale === "th" ? "กิจกรรม" : "Activity"}
        </div>
      )}
      <div style={{ display: "flex", gap: compact ? 4 : 6, overflowX: "auto", width: 0, minWidth: "100%", paddingBottom: 4 }} className="no-scrollbar">
        {activities.map((a) => {
          const selected = value === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              style={{
                display: "flex", alignItems: "center", gap: compact ? 4 : 6,
                padding: compact ? "4px 10px" : "6px 14px", borderRadius: 100, flexShrink: 0,
                border: selected ? "2px solid var(--primary)" : "1.5px solid var(--hairline)",
                background: selected ? "var(--primary-bg, #F4EEFB)" : "var(--surface)",
                cursor: "pointer", transition: "all .15s ease",
              }}
            >
              <span style={{ fontSize: compact ? 14 : 16 }}>{a.emoji}</span>
              <span style={{ fontSize: compact ? 13 : 14, fontWeight: selected ? 700 : 500, color: selected ? "var(--primary)" : "var(--ink)" }}>
                {locale === "th" ? (a.labelTh ?? a.label) : a.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ActivityChip({ activityId, activities }: { activityId: string; activities?: ActivityRow[] }) {
  const locale = useLocale();
  const [fetched, setFetched] = useState<ActivityRow[]>([]);
  const all = activities ?? fetched;

  useEffect(() => {
    if (activities) return;
    fetch("/api/activities")
      .then((r) => r.ok ? r.json() : { activities: [] })
      .then((d) => setFetched((d as { activities: ActivityRow[] }).activities));
  }, [activities]);

  const act = all.find((a) => a.id === activityId);
  if (!act) return null;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 100,
      background: "var(--w-tint-info)", fontSize: 14, fontWeight: 600,
      color: "var(--w-tint-info-fg)",
    }}>
      {act.emoji} {locale === "th" ? (act.labelTh ?? act.label) : act.label}
    </span>
  );
}
