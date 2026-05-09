"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { BottomSheet } from "./bottom-sheet";
import { DaySheet } from "./day-sheet";
import { SmartLogModal } from "./smart-log-modal";
import { AiSummaryCard } from "./calendar-ai-summary";
import { PatternsFeed } from "./calendar-patterns-feed";
import { AskAiBar } from "./calendar-ask-ai";
import type { Tier } from "@/lib/tier";
import type { CalendarAiResult } from "@/db/schema";

interface MonthEntry {
  date: string;
  moodTypeId: string;
}

interface CalendarStats {
  avgMood: number | null;
  avgMoodDelta: number | null;
  streak: number;
  loggedDays: number;
  totalDays: number;
}

const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTH_SHORT_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const EMPTY_COLOR = "#F4F2F7";

function getMoodColor(moodId: string | null): string {
  if (!moodId) return EMPTY_COLOR;
  return DEFAULT_MOODS.find((m) => m.id === moodId)?.color ?? EMPTY_COLOR;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function CalendarShell({
  tier = "free",
  pack,
}: {
  tier?: Tier;
  pack?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("calendar");
  const tSheet = useTranslations("daySheet");
  const tAi = useTranslations("calendarAi");
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<MonthEntry[] | null>(null);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [logDate, setLogDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [aiData, setAiData] = useState<(CalendarAiResult & { tooFewEntries?: boolean; fallbackMonth?: string }) | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPatternsVisible, setAiPatternsVisible] = useState(true);

  function handleDayPress(dateStr: string, isFuture: boolean) {
    if (isFuture) {
      clearTimeout(toastTimer.current);
      setToast(tSheet("futureToast"));
      toastTimer.current = setTimeout(() => setToast(null), 2500);
      return;
    }
    setSheetDate(dateStr);
  }

  const monthNames = locale === "th" ? MONTH_NAMES_TH : MONTH_NAMES_EN;
  const weekdays = locale === "th" ? WEEKDAYS_TH : WEEKDAYS_EN;

  // Fetch month data
  useEffect(() => {
    let alive = true;
    const mm = viewMonth + 1;
    fetch(`/api/calendar?year=${viewYear}&month=${mm}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data as { entries: MonthEntry[]; stats: CalendarStats } | null)
      .then((data) => {
        if (!alive || !data) return;
        setEntries(data.entries);
        setStats(data.stats);
      });
    return () => { alive = false; };
  }, [viewYear, viewMonth, refreshKey]);

  // Fetch AI data (premium only)
  useEffect(() => {
    if (tier !== "premium") return;
    let alive = true;
    setAiLoading(true);
    setAiData(null);
    const mm = viewMonth + 1;
    fetch(`/api/calendar/ai?year=${viewYear}&month=${mm}&locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (data) setAiData(data as CalendarAiResult & { tooFewEntries?: boolean; fallbackMonth?: string });
      })
      .finally(() => { if (alive) setAiLoading(false); });
    return () => { alive = false; };
  }, [viewYear, viewMonth, tier, locale]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // Build day → moodTypeId map for current month
  const entryMap = useMemo(() => {
    const map = new Map<number, string>();
    if (!entries) return map;
    for (const e of entries) {
      const day = parseInt(e.date.slice(8, 10), 10);
      if (!map.has(day)) map.set(day, e.moodTypeId);
    }
    return map;
  }, [entries]);

  const ringMap = useMemo(() => {
    const map = new Map<string, "best" | "recurring" | "anomaly">();
    if (!aiData?.patterns || !aiPatternsVisible || tier !== "premium" || aiData.tooFewEntries) return map;
    for (const p of aiData.patterns) {
      for (const d of p.dates) {
        if (!map.has(d)) map.set(d, p.type);
      }
    }
    return map;
  }, [aiData, aiPatternsVisible, tier]);

  const ringLegend = useMemo(() => {
    if (!aiData?.patterns || !aiPatternsVisible || tier !== "premium") return [];
    return aiData.patterns
      .filter((p) => p.type !== "best")
      .map((p) => ({ type: p.type, title: p.title }));
  }, [aiData, aiPatternsVisible, tier]);

  const totalDaysInMonth = daysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const todayDate = now.getDate();

  return (
    <div className="fade-in pb-28">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>
            {t("yourYear")}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>
            {monthNames[viewMonth]} {viewYear}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={nextMonth} className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── AI Summary Card ── */}
      <AiSummaryCard
        data={aiData?.tooFewEntries && !aiData?.summary ? null : aiData}
        loading={tier === "premium" && aiLoading}
        tier={tier}
        monthLabel={monthNames[viewMonth]}
        tooFewEntries={tier === "premium" && !!aiData?.tooFewEntries && !aiData?.summary}
      />

      {/* ── Patterns Feed ── */}
      <PatternsFeed patterns={aiData?.tooFewEntries ? [] : (aiData?.patterns ?? [])} tier={tier} />

      {/* ── AI Pattern Toggle ── */}
      {tier === "premium" && aiData?.patterns && aiData.patterns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 8 }}>
          <button
            onClick={() => setAiPatternsVisible((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 100,
              background: aiPatternsVisible ? "var(--ink)" : "var(--surface-2)",
              color: aiPatternsVisible ? "#fff" : "var(--ink-2)",
              border: "none",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor" />
            </svg>
            {tAi("patternToggle")} · {aiPatternsVisible ? "ON" : "OFF"}
          </button>
          {aiPatternsVisible && (
            <>
              {aiData.patterns.some((p) => p.type === "best") && (
                <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 100, background: "#FDE8DA",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#FCA45B", flexShrink: 0,
                  }}>★</span>
                  {tAi("legendBest")}
                </span>
              )}
              {ringLegend.map((l, i) => (
                <span key={i} className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 100,
                    background: l.type === "recurring" ? "#A673F1" : "#D4BEE4",
                    flexShrink: 0,
                  }} />
                  {l.title}
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Spacer before grid ── */}
      <div style={{ height: 8 }} />

      {/* ── Monthly Grid ── */}
      {entries === null ? (
        <CalendarSkeleton />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {/* Weekday headers */}
          {weekdays.map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink-3)",
                paddingBottom: 4,
              }}
            >
              {d}
            </div>
          ))}
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {/* Day cells */}
          {Array.from({ length: totalDaysInMonth }).map((_, i) => {
            const day = i + 1;
            const moodId = entryMap.get(day) ?? null;
            const color = getMoodColor(moodId);
            const isToday = isCurrentMonth && day === todayDate;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = sheetDate === dateStr;
            const isFuture = new Date(viewYear, viewMonth, day) > new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const ring = ringMap.get(dateStr);
            const ringColor = ring === "best" ? "#FCA45B" : ring === "recurring" ? "#A673F1" : ring === "anomaly" ? "#D4BEE4" : null;
            return (
              <div
                key={day}
                role="button"
                tabIndex={0}
                onClick={() => handleDayPress(dateStr, isFuture)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleDayPress(dateStr, isFuture);
                  }
                }}
                style={{
                  aspectRatio: "1",
                  borderRadius: 12,
                  background: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: moodId ? "rgba(0,0,0,0.5)" : "var(--ink-3)",
                  border: isSelected
                    ? "2.5px solid var(--ink)"
                    : isToday
                      ? "2.5px solid #FCA45B"
                      : "none",
                  cursor: isFuture ? "default" : "pointer",
                  opacity: isFuture ? 0.4 : 1,
                  transition: "transform 120ms",
                  position: "relative",
                }}
              >
                {day}
                {ring === "best" && (
                  <span style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    width: 16,
                    height: 16,
                    borderRadius: 100,
                    background: "#FDE8DA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    lineHeight: 1,
                    color: "#FCA45B",
                  }}>★</span>
                )}
                {(ring === "recurring" || ring === "anomaly") && (
                  <span style={{
                    position: "absolute",
                    bottom: 3,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 6,
                    borderRadius: 100,
                    background: ring === "recurring" ? "#A673F1" : "#D4BEE4",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Ask AI ── */}
      <AskAiBar
        tier={tier}
        year={viewYear}
        month={viewMonth}
        onDateSelect={(date) => setSheetDate(date)}
      />

      {/* ── Day Sheet ── */}
      <BottomSheet
        open={sheetDate !== null}
        onClose={() => setSheetDate(null)}
        aria-label={tSheet("dayEntries")}
      >
        {sheetDate && (
          <DaySheet
            selectedDate={sheetDate}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onClose={() => setSheetDate(null)}
            onNavigate={(date) => setSheetDate(date)}
            onOpenLog={(date) => {
              setSheetDate(null);
              setLogDate(date);
            }}
          />
        )}
      </BottomSheet>

      {/* ── Smart Log Modal (from empty day CTA) ── */}
      {logDate && (
        <SmartLogModal
          tier={tier}
          pack={pack}
          presetDate={logDate}
          onClose={() => setLogDate(null)}
          onSaved={() => {
            setLogDate(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* ── Future date toast ── */}
      {toast && (
        <div
          className="fade-in"
          style={{
            position: "fixed",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            background: "var(--ink)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, subColor, emoji, bg }: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  emoji?: string;
  bg: string;
}) {
  return (
    <div
      className="flex-1"
      style={{
        background: bg,
        borderRadius: 16,
        padding: "12px 14px",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.3px", marginBottom: 4 }}>
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>
          {value}
        </span>
        {emoji && <span style={{ fontSize: 16 }}>{emoji}</span>}
        {sub && (
          <span style={{ fontSize: 12, fontWeight: 700, color: subColor }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
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
