"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";

/* ── Types ─────────────────────────────────────────────── */

interface Stats {
  streak: number;
  todayMood: { moodId: string; createdAt: number } | null;
  last7: { date: string; moodId: string | null }[];
  distribution: Record<string, number>;
  total30d: number;
}

type Period = "week" | "month" | "year";

interface ActivityItem {
  emoji: string;
  label: string;
  impact: number; // -100..+100
  freq: number;
}

/* ── Constants ─────────────────────────────────────────── */

const MOOD_SCORE: Record<string, number> = {
  amazing: 5,
  happy: 4,
  neutral: 3,
  sad: 2,
  angry: 1,
  anxious: 2,
  tired: 2,
};

const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_TH = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const MOCK_ACTIVITIES: ActivityItem[] = [
  { emoji: "☕", label: "Coffee with friends", impact: 92, freq: 4 },
  { emoji: "🏃", label: "Exercise", impact: 78, freq: 5 },
  { emoji: "📖", label: "Reading", impact: 64, freq: 3 },
  { emoji: "☀️", label: "Sunny weather", impact: 58, freq: 6 },
  { emoji: "💼", label: "Late meetings", impact: -34, freq: 3 },
  { emoji: "🌧️", label: "Rainy commute", impact: -12, freq: 2 },
];

const CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #F2F0F5",
  borderRadius: 24,
  padding: 20,
};

/* ── Helpers ───────────────────────────────────────────── */

function moodById(id: string) {
  return DEFAULT_MOODS.find((m) => m.id === id);
}

function moodEmoji(id: string) {
  return moodById(id)?.emoji ?? "😐";
}

function periodLabel(period: Period, locale: string) {
  const map: Record<Period, [string, string]> = {
    week: ["Last 7 days", "7 วันที่ผ่านมา"],
    month: ["Last 30 days", "30 วันที่ผ่านมา"],
    year: ["Last 365 days", "365 วันที่ผ่านมา"],
  };
  return locale === "th" ? map[period][1] : map[period][0];
}

/* ── Line Chart ────────────────────────────────────────── */

function MoodLineChart({
  last7,
  locale,
}: {
  last7: Stats["last7"];
  locale: string;
}) {
  const W = 320;
  const H = 150;
  const PX = 24;
  const PY = 16;
  const chartW = W - PX * 2;
  const chartH = H - PY * 2;

  const scores = last7.map((d) =>
    d.moodId ? (MOOD_SCORE[d.moodId] ?? 3) : null,
  );

  // Y: score 1..5 mapped to chartH..0
  const toY = (s: number) => PY + chartH - ((s - 1) / 4) * chartH;
  const toX = (i: number) => PX + (i / 6) * chartW;

  // build path from non-null points
  const points: { x: number; y: number; idx: number }[] = [];
  scores.forEach((s, i) => {
    if (s !== null) points.push({ x: toX(i), y: toY(s), idx: i });
  });

  const linePath =
    points.length > 1
      ? points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
      : "";

  const areaPath =
    points.length > 1
      ? linePath +
        ` L${points[points.length - 1].x},${PY + chartH} L${points[0].x},${PY + chartH} Z`
      : "";

  const weekdays = locale === "th" ? WEEKDAYS_TH : WEEKDAYS_EN;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 24}`}
      width="100%"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A673F1" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#A673F1" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* grid lines */}
      {[1, 2, 3, 4, 5].map((s) => (
        <line
          key={s}
          x1={PX}
          x2={W - PX}
          y1={toY(s)}
          y2={toY(s)}
          stroke="#F2F0F5"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ))}

      {/* area fill */}
      {areaPath && <path d={areaPath} fill="url(#lineGrad)" />}

      {/* line */}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#A673F1"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* dots */}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <g key={p.idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={5}
              fill={isLast ? "#A673F1" : "#fff"}
              stroke="#A673F1"
              strokeWidth={2.5}
            />
          </g>
        );
      })}

      {/* weekday labels */}
      {last7.map((_, i) => (
        <text
          key={i}
          x={toX(i)}
          y={H + 16}
          textAnchor="middle"
          fontSize={11}
          fill="var(--ink-3, #999)"
        >
          {weekdays[i % 7]}
        </text>
      ))}
    </svg>
  );
}

/* ── Donut Chart ───────────────────────────────────────── */

function MoodDonut({
  distribution,
  locale,
}: {
  distribution: Record<string, number>;
  locale: string;
}) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const R = 44;
  const stroke = 14;

  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F2F0F5" strokeWidth={stroke} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink-3, #999)">
          7d
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="var(--ink-3, #999)">
          MOODS
        </text>
      </svg>
    );
  }

  const segments: React.ReactElement[] = [];
  let angle = -90;

  entries.forEach(([moodId, count]) => {
    const mood = moodById(moodId);
    const pct = count / total;
    const sweep = pct * 360;
    const startRad = (angle * Math.PI) / 180;
    const endRad = ((angle + sweep) * Math.PI) / 180;

    const x1 = cx + R * Math.cos(startRad);
    const y1 = cy + R * Math.sin(startRad);
    const x2 = cx + R * Math.cos(endRad);
    const y2 = cy + R * Math.sin(endRad);
    const largeArc = sweep > 180 ? 1 : 0;

    segments.push(
      <path
        key={moodId}
        d={`M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={mood?.color ?? "#ccc"}
        strokeWidth={stroke}
        strokeLinecap="round"
      />,
    );
    angle += sweep;
  });

  // find top mood
  const topMoodId = entries.sort((a, b) => b[1] - a[1])[0]?.[0];
  const topMood = moodById(topMoodId ?? "neutral");

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block", maxWidth: 120 }}>
        {segments}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink-3, #999)">
          7d
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="var(--ink-3, #999)">
          MOODS
        </text>
      </svg>
      {topMood && (
        <div style={{ fontSize: 12, color: "var(--ink-2, #666)", textAlign: "center" }}>
          Top: {topMood.emoji}{" "}
          {locale === "th" ? topMood.labelTh : topMood.label}
        </div>
      )}
    </div>
  );
}

/* ── Activity Impact Bar ───────────────────────────────── */

function ActivityBar({ impact }: { impact: number }) {
  const barW = 100;
  const mid = barW / 2;
  const len = (Math.abs(impact) / 100) * mid;
  const isPositive = impact >= 0;
  const x = isPositive ? mid : mid - len;

  return (
    <svg viewBox={`0 0 ${barW} 10`} width={barW} height={10} style={{ flexShrink: 0 }}>
      <rect x={0} y={3} width={barW} height={4} rx={2} fill="#F2F0F5" />
      <line x1={mid} y1={0} x2={mid} y2={10} stroke="#E0DDE5" strokeWidth={1} />
      <rect
        x={x}
        y={2}
        width={len}
        height={6}
        rx={3}
        fill={isPositive ? "#A673F1" : "#FEAD8D"}
      />
    </svg>
  );
}

/* ── Main Component ────────────────────────────────────── */

export function StatsShell() {
  const locale = useLocale();

  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>("week");

  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((r) =>
        r.ok
          ? r.json()
          : { streak: 0, todayMood: null, last7: [], distribution: {}, total30d: 0 },
      )
      .then((data) => {
        if (alive) setStats(data as Stats);
      });
    return () => {
      alive = false;
    };
  }, []);

  const last7 = stats?.last7 ?? [];
  const distribution = stats?.distribution ?? {};

  // compute average mood
  const scored = last7
    .filter((d) => d.moodId)
    .map((d) => MOOD_SCORE[d.moodId!] ?? 3);
  const avg = scored.length > 0 ? scored.reduce((a, b) => a + b, 0) / scored.length : 0;
  const avgRounded = Math.round(avg * 10) / 10;

  // emoji for average
  const avgEmoji =
    avg >= 4.5 ? "😄" : avg >= 3.5 ? "🙂" : avg >= 2.5 ? "😐" : avg >= 1.5 ? "😔" : "😢";

  // best day
  const bestEntry = last7.reduce<{ date: string; moodId: string; score: number } | null>(
    (best, d) => {
      if (!d.moodId) return best;
      const s = MOOD_SCORE[d.moodId] ?? 3;
      if (!best || s > best.score) return { date: d.date, moodId: d.moodId, score: s };
      return best;
    },
    null,
  );

  const bestDayName = bestEntry
    ? new Date(bestEntry.date).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
        weekday: "long",
      })
    : "---";

  const PERIODS: Period[] = ["week", "month", "year"];
  const periodLabels: Record<Period, string> = {
    week: locale === "th" ? "สัปดาห์" : "Week",
    month: locale === "th" ? "เดือน" : "Month",
    year: locale === "th" ? "ปี" : "Year",
  };

  return (
    <>
      {/* ── HEADER ─── */}
      <section className="mb-5 fade-in" style={{ paddingTop: 8 }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-3, #999)" }}>
              {periodLabel(period, locale)}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink, #1a1a1a)", margin: 0 }}>
              {locale === "th" ? "สถิติ" : "Stats"}
            </h1>
          </div>

          {/* segmented control */}
          <div
            style={{
              display: "flex",
              background: "#F8F6FB",
              borderRadius: 12,
              padding: 3,
              gap: 2,
            }}
          >
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: period === p ? "#fff" : "transparent",
                  color: period === p ? "var(--ink, #1a1a1a)" : "var(--ink-3, #999)",
                  boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOOD LINE CHART CARD ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "40ms" }}>
        <div style={CARD_STYLE}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-3, #999)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {locale === "th" ? "อารมณ์เฉลี่ย" : "Average Mood"}
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 28, fontWeight: 800, color: "var(--ink, #1a1a1a)" }}>
                  {avgRounded > 0 ? avgRounded.toFixed(1) : "---"}
                </span>
                {avgRounded > 0 && <span style={{ fontSize: 24 }}>{avgEmoji}</span>}
              </div>
            </div>
            {avgRounded > 0 && (
              <div
                style={{
                  background: "#E8F8EE",
                  color: "#2DA963",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                ↑ 0.6 {locale === "th" ? "จากสัปดาห์ก่อน" : "vs last week"}
              </div>
            )}
          </div>
          <MoodLineChart last7={last7} locale={locale} />
        </div>
      </section>

      {/* ── 2-COLUMN GRID ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "80ms" }}>
        <div className="grid grid-cols-2 gap-4">
          {/* Mood Mix */}
          <div style={CARD_STYLE}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-3, #999)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {locale === "th" ? "สัดส่วนอารมณ์" : "Mood Mix"}
            </div>
            <MoodDonut distribution={distribution} locale={locale} />
          </div>

          {/* Best Day */}
          <div style={CARD_STYLE}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-3, #999)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {locale === "th" ? "วันที่ดีที่สุด" : "Best Day"}
            </div>
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 120 }}>
              {bestEntry ? (
                <>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      background: moodById(bestEntry.moodId)?.color ?? "#F2F0F5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      marginBottom: 8,
                    }}
                  >
                    {moodEmoji(bestEntry.moodId)}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--ink, #1a1a1a)",
                    }}
                  >
                    {bestDayName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3, #999)" }}>
                    {locale === "th" ? "คะแนน" : "Score"}: {bestEntry.score}/5
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "var(--ink-3, #999)" }}>
                  {locale === "th" ? "ยังไม่มีข้อมูล" : "No data yet"}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVITY IMPACT ─── */}
      <section className="fade-in" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-2 mb-1">
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3, #999)", letterSpacing: 0.5, textTransform: "uppercase" }}>
            {locale === "th" ? "อะไรทำให้อารมณ์ดี" : "What lifts your mood"}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink, #1a1a1a)", margin: 0 }}>
            {locale === "th" ? "ผลกระทบกิจกรรม" : "Activity impact"}
          </h2>
          <span
            style={{
              background: "#F0EAFF",
              color: "#A673F1",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            ✨ AI
          </span>
        </div>

        <div style={CARD_STYLE}>
          <div className="flex flex-col gap-3">
            {MOCK_ACTIVITIES.map((act) => (
              <div key={act.label} className="flex items-center gap-3" style={{ minHeight: 32 }}>
                <span style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>
                  {act.emoji}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink, #1a1a1a)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {act.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: act.impact >= 0 ? "#2DA963" : "#E05A5A",
                    width: 48,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {act.impact >= 0 ? "+" : ""}
                  {act.impact}%
                </div>
                <ActivityBar impact={act.impact} />
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3, #999)",
                    flexShrink: 0,
                    width: 24,
                    textAlign: "right",
                  }}
                >
                  ×{act.freq}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
