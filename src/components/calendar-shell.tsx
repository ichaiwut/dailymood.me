"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DaySheet } from "./day-sheet";
import { SmartLogModal } from "./smart-log-modal";
import { AiSummaryCard } from "./calendar-ai-summary";
import { PatternsFeed } from "./calendar-patterns-feed";
import { AskAiBar } from "./calendar-ask-ai";
import { TimelineFeed } from "./timeline-feed";
import type { TimelineEntry } from "./timeline-feed";
import { Link } from "@/i18n/navigation";
import type { Tier } from "@/lib/tier";
import type { CalendarAiResult } from "@/db/schema";
import { trackCalendarView } from "@/lib/analytics";

type CalView = "calendar" | "timeline";

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
  iconFormat = "svg",
}: {
  tier?: Tier;
  pack?: string;
  iconFormat?: string;
}) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const askAiQuery = searchParams.get("askAi") ?? undefined;
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

  const [calView, setCalView] = useState<CalView>("calendar");
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[] | null>(null);
  const [timelineFilter, setTimelineFilter] = useState("all");

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

  // Fetch timeline data (only when timeline view is active)
  useEffect(() => {
    if (calView !== "timeline") { setTimelineEntries(null); return; }
    let alive = true;
    const mm = viewMonth + 1;
    fetch(`/api/calendar/timeline?year=${viewYear}&month=${mm}`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => {
        if (alive) setTimelineEntries((data as { entries: TimelineEntry[] }).entries);
      });
    return () => { alive = false; };
  }, [viewYear, viewMonth, refreshKey, calView]);

  useEffect(() => {
    if (sheetDate) { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }
  }, [sheetDate]);

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
      {/* ── Header + View toggle ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>
            {calView === "timeline" && timelineEntries
              ? `${timelineEntries.length.toLocaleString()} ${locale === "th" ? "รายการ" : "entries"}`
              : t("yourYear")}
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

      {/* ── View Toggle ── */}
      <div style={{ display: "flex", background: "#F4F2F7", borderRadius: 12, padding: 3, gap: 2, marginBottom: 16 }}>
        {(["calendar", "timeline"] as CalView[]).map((v) => (
          <button
            key={v}
            onClick={() => { if (v !== calView) { setCalView(v); trackCalendarView(v); } }}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              transition: "all 0.18s ease",
              background: calView === v ? "#fff" : "transparent",
              color: calView === v ? "var(--ink)" : "var(--ink-3)",
              boxShadow: calView === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {v === "calendar" ? t("tabCalendar") : t("tabTimeline")}
          </button>
        ))}
        <Link
          href={"/year-in-pixels" as "/"}
          style={{
            flex: 1,
            padding: "8px 0",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            border: "none",
            textDecoration: "none",
            textAlign: "center",
            background: "transparent",
            color: "var(--ink-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {t("tabYear")}
          {tier !== "premium" && <span style={{ fontSize: 14 }}>🔒</span>}
        </Link>
      </div>

      {calView === "calendar" ? (
        <div>
      {/* ── Calendar grid + stats sidebar ── */}
      <div className="grid-2col">
      <div>{/* left column */}

      {/* ── AI Features (Premium only) ── */}
      {tier === "premium" ? (
        <>
          <AiSummaryCard
            data={aiData?.tooFewEntries && !aiData?.summary ? null : aiData}
            loading={aiLoading}
            tier={tier}
            monthLabel={monthNames[viewMonth]}
            tooFewEntries={!!aiData?.tooFewEntries && !aiData?.summary}
            pack={pack}
            iconFormat={iconFormat}
          />
          <AskAiBar
            tier={tier}
            year={viewYear}
            month={viewMonth}
            onDateSelect={(date) => setSheetDate(date)}
            initialQuery={askAiQuery}
          />
          <PatternsFeed patterns={aiData?.tooFewEntries ? [] : (aiData?.patterns ?? [])} tier={tier} onDateSelect={(date) => setSheetDate(date)} />
        </>
      ) : (
        <a
          href="/profile/subscription"
          style={{
            display: "block", textDecoration: "none", marginBottom: 16,
            background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 100%)",
            borderRadius: 18, padding: "16px 20px",
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 24 }}>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                AI สรุป + แพทเทิร์น + ถาม AI
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
                ปลดล็อกด้วย Premium
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1" }}>อัปเกรด →</span>
          </div>
        </a>
      )}

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
              fontSize: 14,
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
                <span className="flex items-center gap-1" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 100, background: "#FDE8DA",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: "#FCA45B", flexShrink: 0,
                  }}>★</span>
                  {tAi("legendBest")}
                </span>
              )}
              {ringLegend.map((l, i) => (
                <span key={i} className="flex items-center gap-1" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
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
                fontSize: 14,
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
                    fontSize: 14,
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

      </div>{/* end left column */}

      {/* ── Right sidebar stats ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignSelf: "start", position: "sticky", top: 80 }}>
        {[
          { label: locale === "th" ? "อารมณ์เฉลี่ย" : "Avg Mood", value: stats?.avgMood ? stats.avgMood.toFixed(1) : "—", sub: stats?.avgMoodDelta ? `${stats.avgMoodDelta > 0 ? "↑" : "↓"} ${Math.abs(stats.avgMoodDelta).toFixed(1)} ${locale === "th" ? "จากเดือนก่อน" : "vs last month"}` : "", color: "var(--peach)" },
          { label: "Streak", value: String(stats?.streak ?? 0), sub: `${locale === "th" ? "วันติดต่อกัน 🔥" : "consecutive days 🔥"}`, color: "var(--purple)" },
          { label: locale === "th" ? "บันทึก" : "Logged", value: String(stats?.loggedDays ?? 0), sub: `${locale === "th" ? "ครั้งในเดือนนี้" : "this month"}`, color: "var(--mint)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18, borderLeft: `4px solid ${s.color}` }}>
            <div className="w-eyebrow">{s.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>{s.value}</span>
              <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{s.sub}</span>
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: 18 }}>
          <div className="w-eyebrow" style={{ marginBottom: 10 }}>{locale === "th" ? "คำอธิบายสี" : "Legend"}</div>
          {DEFAULT_MOODS.slice(0, 6).map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: m.color }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{locale === "th" ? m.labelTh : m.label}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>
      ) : (
        <TimelineFeed
          entries={timelineEntries}
          activeFilter={timelineFilter}
          onFilterChange={setTimelineFilter}
          locale={locale}
          monthLabel={monthNames[viewMonth]}
          pack={pack}
          iconFormat={iconFormat}
        />
      )}


      {/* ── Day Sheet Modal ── */}
      {sheetDate && (
        <div className="fixed inset-0 z-50 fade-in" style={{ background: "rgba(26,19,32,.55)", backdropFilter: "blur(8px)" }} onClick={(e) => { if (e.target === e.currentTarget) setSheetDate(null); }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxWidth: 560, width: "calc(100% - 32px)", maxHeight: "85vh", overflowY: "auto", borderRadius: 22, boxShadow: "0 40px 80px -20px rgba(0,0,0,.4)" }}>
            <DaySheet
              selectedDate={sheetDate}
              viewYear={viewYear}
              viewMonth={viewMonth}
              onClose={() => setSheetDate(null)}
              onNavigate={(date) => setSheetDate(date)}
              onOpenLog={(date) => { setSheetDate(null); setLogDate(date); }}
              pack={pack}
              iconFormat={iconFormat}
            />
          </div>
        </div>
      )}

      {/* ── Smart Log Modal (from empty day CTA) ── */}
      {logDate && (
        <SmartLogModal
          tier={tier}
          pack={pack}
          iconFormat={iconFormat}
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
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.3px", marginBottom: 4 }}>
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>
          {value}
        </span>
        {emoji && <span style={{ fontSize: 16 }}>{emoji}</span>}
        {sub && (
          <span style={{ fontSize: 14, fontWeight: 700, color: subColor }}>
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
