"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { MoodIcon } from "./mood-icon";

interface Entry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags: string[] | null;
  sentiment: number | null;
  imageUrl: string | null;
  aiSource: string;
  createdAt: string | number;
}

const SHORT_MONTH = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function MoodTimeline({
  refreshKey = 0,
  pack = DEFAULT_MOOD_PACK,
}: {
  refreshKey?: number;
  pack?: string;
}) {
  const t = useTranslations("timeline");
  const locale = useLocale();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    fetch("/api/log")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => setEntries((d as { entries: Entry[] }).entries));
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
        const mood = DEFAULT_MOODS.find((m) => m.id === e.moodTypeId);
        const date = new Date(e.createdAt);
        const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        const day = date.getDate();
        const monthShort = SHORT_MONTH[date.getMonth()];
        const isAI = e.aiSource !== "manual";
        return (
          <li
            key={e.id}
            className="card p-3.5 fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-3">
              {/* date stamp */}
              <div
                className="card-tile shrink-0 grid place-items-center text-center"
                style={{ width: 56, height: 56, padding: 0 }}
              >
                <div className="leading-none">
                  <div
                    className="text-[10px] font-bold tracking-wide"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {monthShort}
                  </div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: "var(--ink)", marginTop: 2 }}
                  >
                    {day}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--ink)" }}
                  >
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
                  {isAI && <span className="pill pill-ai">AI</span>}
                </div>
                {e.note && (
                  <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--ink-2)" }}>
                    {e.note}
                  </p>
                )}
                {e.tags && e.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {e.tags.slice(0, 4).map((tag, k) => (
                      <span key={k} className="pill" style={{ padding: "0.15rem 0.55rem", fontSize: "0.7rem" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {e.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.imageUrl}
                    alt=""
                    className="mt-2 max-h-32 rounded-xl"
                  />
                )}
              </div>

              {/* mood icon avatar */}
              <span
                className="mood-disc shrink-0 grid place-items-center"
                style={{
                  width: 48,
                  height: 48,
                  background: `${mood?.color ?? "#999"}26`,
                  padding: 6,
                }}
              >
                <MoodIcon moodId={e.moodTypeId} emoji={mood?.emoji} pack={pack} size={36} />
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
