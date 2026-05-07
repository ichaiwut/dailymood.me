"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { MoodIcon } from "./mood-icon";

const GUEST_TTL_MS = 24 * 60 * 60 * 1000;
const SHORT_MONTH = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

interface GuestEntry {
  moodId: string;
  note: string;
  timestamp: number;
}

export function GuestTimeline({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useTranslations("timeline");
  const locale = useLocale();
  const [entries, setEntries] = useState<Array<{ id: string } & GuestEntry> | null>(null);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("mood_entries") || "{}") as Record<
      string,
      GuestEntry
    >;
    const now = Date.now();
    const fresh: Record<string, GuestEntry> = {};
    for (const [id, e] of Object.entries(raw)) {
      if (now - e.timestamp <= GUEST_TTL_MS) fresh[id] = e;
    }
    if (Object.keys(fresh).length !== Object.keys(raw).length) {
      localStorage.setItem("mood_entries", JSON.stringify(fresh));
    }
    setEntries(
      Object.entries(fresh)
        .map(([id, e]) => ({ id, ...e }))
        .sort((a, b) => b.timestamp - a.timestamp),
    );
  }, [refreshKey]);

  if (entries === null)
    return <p className="text-sm px-1" style={{ color: "var(--ink-3)" }}>{t("loading")}</p>;
  if (entries.length === 0)
    return (
      <div className="card p-6 text-center text-sm" style={{ color: "var(--ink-3)" }}>
        {t("empty")}
      </div>
    );

  return (
    <ol className="space-y-2.5">
      {entries.map((e, i) => {
        const mood = DEFAULT_MOODS.find((m) => m.id === e.moodId);
        const date = new Date(e.timestamp);
        const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        const day = date.getDate();
        const monthShort = SHORT_MONTH[date.getMonth()];
        return (
          <li
            key={e.id}
            className="card p-3.5 fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="card-tile shrink-0 grid place-items-center text-center"
                style={{ width: 56, height: 56, padding: 0 }}
              >
                <div className="leading-none">
                  <div className="text-[10px] font-bold tracking-wide" style={{ color: "var(--ink-3)" }}>
                    {monthShort}
                  </div>
                  <div className="text-xl font-bold" style={{ color: "var(--ink)", marginTop: 2 }}>
                    {day}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                    {locale === "th" ? mood?.labelTh : mood?.label}
                  </span>
                  <span
                    aria-hidden
                    className="inline-block w-1 h-1 rounded-full"
                    style={{ background: "var(--ink-3)" }}
                  />
                  <span className="text-xs font-medium" style={{ color: "var(--ink-3)" }}>
                    {time}
                  </span>
                </div>
                {e.note && (
                  <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--ink-2)" }}>
                    {e.note}
                  </p>
                )}
              </div>
              <span
                className="mood-disc shrink-0 grid place-items-center"
                style={{
                  width: 48,
                  height: 48,
                  background: `${mood?.color ?? "#999"}26`,
                  padding: 6,
                }}
              >
                <MoodIcon moodId={e.moodId} emoji={mood?.emoji} size={36} />
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
