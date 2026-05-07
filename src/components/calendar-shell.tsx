"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";

/* ─── Types ─── */

interface MonthEntry {
  date: string; // YYYY-MM-DD
  moodTypeId: string;
}

interface CalendarStats {
  streak: number;
  avgMoodIndex: number;
  avgMoodDelta: number; // positive = improved
  loggedCount: number;
  totalDays: number;
}

/* ─── Helpers ─── */

const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WEEKDAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
] as const;

const MONTH_SHORT_EN = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

const EMPTY_COLOR = "#F4F2F7";

function getMoodColor(moodId: string | null): string {
  if (!moodId) return EMPTY_COLOR;
  return DEFAULT_MOODS.find((m) => m.id === moodId)?.color ?? EMPTY_COLOR;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ─── Component ─── */

export function CalendarShell() {
  const locale = useLocale();
  const isTh = locale === "th";

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [entries, setEntries] = useState<MonthEntry[] | null>(null);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [yearEntries, setYearEntries] = useState<MonthEntry[] | null>(null);

  /* fetch month data */
  useEffect(() => {
    let alive = true;
    const mm = String(viewMonth + 1).padStart(2, "0");

    Promise.all([
      fetch(`/api/log?year=${viewYear}&month=${mm}`).then((r) =>
        r.ok ? r.json() : { entries: [] },
      ),
      fetch("/api/stats").then((r) =>
        r.ok
          ? r.json()
          : { streak: 0, avgMoodIndex: 2, avgMoodDelta: 0, loggedCount: 0, totalDays: 0 },
      ),
    ]).then(([logData, statsData]) => {
      if (!alive) return;

      const fetched = (logData as { entries?: MonthEntry[] }).entries ?? [];
      setEntries(fetched);

      const total = daysInMonth(viewYear, viewMonth);
      setStats({
        streak: (statsData as CalendarStats).streak ?? 0,
        avgMoodIndex: (statsData as CalendarStats).avgMoodIndex ?? 2,
        avgMoodDelta: (statsData as CalendarStats).avgMoodDelta ?? 0,
        loggedCount: fetched.length,
        totalDays: total,
      });
    });

    return () => { alive = false; };
  }, [viewYear, viewMonth]);

  /* fetch year data for year-in-pixels */
  useEffect(() => {
    let alive = true;
    fetch(`/api/log?year=${viewYear}`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => {
        if (!alive) return;
        setYearEntries((data as { entries?: MonthEntry[] }).entries ?? []);
      });
    return () => { alive = false; };
  }, [viewYear]);

  const goPrev = useCallback(() => {
    setEntries(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goNext = useCallback(() => {
    setEntries(null);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  /* ── Build calendar grid ── */
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = startDayOfMonth(viewYear, viewMonth);

  const entryMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (entries) {
      for (const e of entries) {
        const day = e.date.split("-")[2];
        map[parseInt(day, 10).toString()] = e.moodTypeId;
      }
    }
    return map;
  }, [entries]);

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  /* ── Year-in-pixels map ── */
  const yearMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (yearEntries) {
      for (const e of yearEntries) {
        map[e.date] = e.moodTypeId;
      }
    }
    return map;
  }, [yearEntries]);

  const weekdays = isTh ? WEEKDAYS_TH : WEEKDAYS_EN;
  const monthLabel = isTh ? MONTH_NAMES_TH[viewMonth] : MONTH_NAMES_EN[viewMonth];

  const streak = stats?.streak ?? 0;
  const avgIdx = stats?.avgMoodIndex ?? 2;
  const avgDelta = stats?.avgMoodDelta ?? 0;
  const loggedCount = stats?.loggedCount ?? 0;

  return (
    <>
      {/* ── HEADER ── */}
      <section className="fade-in mt-4 mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginBottom: 2 }}>
              {isTh ? "ปีของคุณ" : "Your year"}
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>
              {monthLabel} {viewYear}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="icon-btn" aria-label="Filter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 6h16M7 12h10M10 18h4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button className="icon-btn" onClick={goPrev} aria-label="Previous month">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="icon-btn" onClick={goNext} aria-label="Next month">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── MINI STATS ROW ── */}
      <section className="fade-in mb-5" style={{ animationDelay: "40ms" }}>
        <div className="flex gap-3">
          {/* AVG MOOD */}
          <div
            className="flex-1"
            style={{
              background: "#F8F6FB",
              borderRadius: 18,
              padding: "14px 16px",
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.5px", marginBottom: 4 }}>
              AVG MOOD
            </p>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
                {avgIdx.toFixed(1)}
              </span>
              <span style={{ fontSize: 13, color: avgDelta >= 0 ? "#34C77B" : "#F06060" }}>
                {avgDelta >= 0 ? "↑" : "↓"}
              </span>
            </div>
          </div>

          {/* STREAK */}
          <div
            className="flex-1"
            style={{
              background: "#FFF4EB",
              borderRadius: 18,
              padding: "14px 16px",
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.5px", marginBottom: 4 }}>
              STREAK
            </p>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
                {streak}
              </span>
              <span style={{ fontSize: 13 }}>
                {isTh ? "วัน 🔥" : "days 🔥"}
              </span>
            </div>
          </div>

          {/* LOGGED */}
          <div
            className="flex-1"
            style={{
              background: "#EBF8F2",
              borderRadius: 18,
              padding: "14px 16px",
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.5px", marginBottom: 4 }}>
              LOGGED
            </p>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
                {loggedCount}
              </span>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
                / {totalDays}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MONTHLY MOOD GRID ── */}
      <section className="fade-in mb-6" style={{ animationDelay: "80ms" }}>
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #F2F0F5",
            borderRadius: 22,
            padding: 18,
          }}
        >
          {/* Weekday headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {weekdays.map((d, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--ink-3)",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {entries === null ? (
            <CalendarSkeleton startDay={startDay} totalDays={totalDays} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 6,
              }}
            >
              {/* Empty leading cells */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const moodId = entryMap[day.toString()] ?? null;
                const color = getMoodColor(moodId);
                const todayHighlight = isToday(day);

                return (
                  <div
                    key={day}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 12,
                      background: color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: moodId ? "#0A0A0A" : "var(--ink-3)",
                      position: "relative",
                      boxShadow: todayHighlight
                        ? "0 0 0 2.5px #FCA45B"
                        : undefined,
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── YEAR IN PIXELS ── */}
      <section className="fade-in mb-6" style={{ animationDelay: "120ms" }}>
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #F2F0F5",
            borderRadius: 22,
            padding: 18,
          }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>
              {isTh ? "ปีในพิกเซล" : "Year in pixels"}
            </h2>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)" }}>
              {viewYear}
            </span>
          </div>

          {/* Month columns header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 3,
              marginBottom: 6,
            }}
          >
            {MONTH_SHORT_EN.map((m) => (
              <div
                key={m}
                style={{
                  textAlign: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "var(--ink-3)",
                  letterSpacing: "0.3px",
                }}
              >
                {m}
              </div>
            ))}
          </div>

          {/* Pixel grid: 31 rows x 12 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 3,
            }}
          >
            {Array.from({ length: 31 }).map((_, rowIdx) => {
              const day = rowIdx + 1;
              return Array.from({ length: 12 }).map((_, colIdx) => {
                const monthDays = daysInMonth(viewYear, colIdx);
                if (day > monthDays) {
                  return <div key={`${colIdx}-${day}`} />;
                }
                const dateStr = `${viewYear}-${String(colIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const moodId = yearMap[dateStr] ?? null;
                const color = getMoodColor(moodId);

                return (
                  <div
                    key={`${colIdx}-${day}`}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 3,
                      background: color,
                    }}
                  />
                );
              });
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            {DEFAULT_MOODS.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5">
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: m.color,
                  }}
                />
                <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>
                  {isTh ? m.labelTh : m.label}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: EMPTY_COLOR,
                }}
              />
              <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>
                {isTh ? "ไม่มีข้อมูล" : "No data"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Calendar skeleton ─── */

function CalendarSkeleton({
  startDay,
  totalDays,
}: {
  startDay: number;
  totalDays: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 6,
      }}
    >
      {Array.from({ length: startDay }).map((_, i) => (
        <div key={`es-${i}`} />
      ))}
      {Array.from({ length: totalDays }).map((_, i) => (
        <div
          key={`sk-${i}`}
          style={{
            aspectRatio: "1",
            borderRadius: 12,
            background: "var(--surface-2)",
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}
