"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EntryMiniCard, type SheetEntry } from "./entry-mini-card";

interface DaySheetProps {
  selectedDate: string;
  viewYear: number;
  viewMonth: number;
  onClose: () => void;
  onNavigate: (date: string) => void;
  onOpenLog: (date: string) => void;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDay(dateStr: string): number {
  return parseInt(dateStr.slice(8, 10), 10);
}

export function DaySheet({
  selectedDate,
  viewYear,
  viewMonth,
  onClose,
  onNavigate,
  onOpenLog,
}: DaySheetProps) {
  const locale = useLocale();
  const t = useTranslations("daySheet");
  const [entries, setEntries] = useState<SheetEntry[] | null>(null);

  const day = parseDay(selectedDate);
  const total = daysInMonth(viewYear, viewMonth);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isFuture = new Date(viewYear, viewMonth, day) > todayMidnight;
  const nextDayIsFuture = new Date(viewYear, viewMonth, day + 1) > todayMidnight;
  const hasPrev = day > 1;
  const hasNext = day < total && !nextDayIsFuture;

  const displayDate = new Date(selectedDate + "T12:00:00");
  const weekday = displayDate.toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { weekday: "long" },
  );
  const monthDay = displayDate.toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { month: "long", day: "numeric" },
  );

  useEffect(() => {
    let alive = true;
    setEntries(null);
    fetch(`/api/log?date=${selectedDate}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        setEntries(
          (data as { entries: SheetEntry[] } | null)?.entries ?? [],
        );
      });
    return () => {
      alive = false;
    };
  }, [selectedDate]);

  function goPrev() {
    if (!hasPrev) return;
    onNavigate(formatDateStr(viewYear, viewMonth, day - 1));
  }
  function goNext() {
    if (!hasNext) return;
    onNavigate(formatDateStr(viewYear, viewMonth, day + 1));
  }

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Date header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 16 }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-3)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {weekday}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--ink)",
              lineHeight: 1.2,
            }}
          >
            {monthDay}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="icon-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              opacity: hasPrev ? 1 : 0.3,
            }}
            aria-label={t("prevDay")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="icon-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              opacity: hasNext ? 1 : 0.3,
            }}
            aria-label={t("nextDay")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {entries === null ? (
        <SheetSkeleton />
      ) : entries.length === 0 ? (
        isFuture ? (
          <FutureState />
        ) : (
          <EmptyState onLog={() => onOpenLog(selectedDate)} />
        )
      ) : (
        <div className="flex flex-col gap-4">
          {entries.length > 1 && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ink-3)",
                letterSpacing: "0.3px",
              }}
            >
              {t("entries", { count: entries.length })}
            </div>
          )}
          {entries.map((entry) => (
            <EntryMiniCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onLog }: { onLog: () => void }) {
  const t = useTranslations("daySheet");
  return (
    <div
      className="flex flex-col items-center fade-in"
      style={{ padding: "24px 0 8px", textAlign: "center" }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: 4,
        }}
      >
        {t("emptyTitle")}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--ink-2)",
          marginBottom: 20,
        }}
      >
        {t("emptyBody")}
      </div>
      <button
        onClick={onLog}
        className="flex items-center justify-center gap-2"
        style={{
          height: 48,
          width: "100%",
          maxWidth: 260,
          background: "var(--peach)",
          color: "#fff",
          border: "none",
          borderRadius: 100,
          fontWeight: 700,
          fontSize: 15,
          boxShadow: "0 8px 20px rgba(252,164,91,0.35)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        {t("logMood")}
      </button>
    </div>
  );
}

function FutureState() {
  const t = useTranslations("daySheet");
  return (
    <div
      className="flex flex-col items-center fade-in"
      style={{ padding: "24px 0 8px", textAlign: "center" }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔮</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: 4,
        }}
      >
        {t("futureToast")}
      </div>
    </div>
  );
}

function SheetSkeleton() {
  return (
    <div className="flex flex-col gap-3 fade-in">
      <div
        style={{
          height: 100,
          borderRadius: 20,
          background: "var(--surface-2)",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          height: 16,
          width: "60%",
          borderRadius: 6,
          background: "var(--surface-2)",
          opacity: 0.4,
        }}
      />
      <div
        style={{
          height: 44,
          borderRadius: 100,
          background: "var(--surface-2)",
          opacity: 0.3,
        }}
      />
    </div>
  );
}
