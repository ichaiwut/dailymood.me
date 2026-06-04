"use client";

import React, { useEffect, useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackStatsView, trackPremiumGate } from "@/lib/analytics";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { moodScore, scoreToEmoji } from "@/lib/mood-scores";
import { moodIconUrl, DEFAULT_MOOD_PACK } from "@/lib/moods";
import type { Tier } from "@/lib/tier";
import type { ChartAnnotation, SpecialDay } from "@/db/schema";
import { AiDisclaimer } from "./ai-disclaimer";
import { ShareCardModal } from "./share-card-modal";
import type { ShareCardData } from "./share-card";

/* ── Types ─────────────────────────────────────────────── */

type Period = "week" | "month" | "year";

interface StatsData {
  streak: number;
  todayMood: { moodId: string; createdAt: number } | null;
  moodTrend: { date: string; moodId: string | null }[];
  distribution: Record<string, number>;
  total: number;
  avgScore: number | null;
  avgScoreDelta: number | null;
  bestDay: { date: string; moodId: string; score: number; entries: number } | null;
  activityImpact: { tag: string; impact: number; freq: number }[];
  annotations?: ChartAnnotation[] | null;
  premiumRequired?: boolean;
}

/* ── Constants ─────────────────────────────────────────── */

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline-2)",
  borderRadius: 24,
  padding: 20,
};

const LABEL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink-3, #999)",
  letterSpacing: 0.5,
  textTransform: "uppercase" as const,
  marginBottom: 4,
};

const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_TH = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

/* ── Helpers ───────────────────────────────────────────── */

function moodById(id: string) {
  return DEFAULT_MOODS.find((m) => m.id === id);
}

/* ── Line Chart ────────────────────────────────────────── */

function MoodLineChart({
  trend,
  period,
  locale,
  moodPack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
  annotations,
  tier,
  specialDays,
}: {
  trend: { date: string; moodId: string | null }[];
  period: Period;
  locale: string;
  moodPack?: string;
  iconFormat?: string;
  annotations?: ChartAnnotation[] | null;
  tier: Tier;
  specialDays?: SpecialDay[];
}) {
  const W = 340;
  const H = 150;
  const PX = 36;
  const PY = 16;
  const SCORE_MOODS: Record<number, string> = { 5: "amazing", 4: "happy", 3: "neutral", 2: "sad", 1: "angry" };
  const chartW = W - PX * 2;
  const chartH = H - PY * 2;

  const scores = trend.map((d) => (d.moodId ? moodScore(d.moodId) : null));
  const toY = (s: number) => PY + chartH - ((s - 1) / 4) * chartH;
  const toX = (i: number) => PX + (i / Math.max(trend.length - 1, 1)) * chartW;

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
      ? linePath + ` L${points[points.length - 1].x},${PY + chartH} L${points[0].x},${PY + chartH} Z`
      : "";

  const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  let labels: string[] = [];
  if (period === "week") {
    labels = locale === "th" ? WEEKDAYS_TH : WEEKDAYS_EN;
  } else if (period === "month") {
    labels = trend.map((d, i) => (i % 5 === 0 ? d.date.slice(8) : ""));
  } else {
    const months = locale === "th" ? MONTHS_TH : MONTHS_EN;
    labels = trend.map((d) => {
      const m = parseInt(d.date.slice(5, 7), 10) - 1;
      return months[m] ?? "";
    });
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activePin, setActivePin] = useState<ChartAnnotation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeMarker, setActiveMarker] = useState<SpecialDay | null>(null);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);

  const pinAnnotations = (tier === "premium" && annotations && annotations.length > 0) ? annotations : null;

  const annotationMap = new Map<number, ChartAnnotation>();
  if (pinAnnotations) {
    for (const ann of pinAnnotations) {
      const idx = trend.findIndex((d) => d.date === ann.dateKey);
      if (idx >= 0) annotationMap.set(idx, ann);
    }
  }

  function handleMarkerHover(sd: SpecialDay, svgX: number, svgY: number) {
    const el = wrapperRef.current;
    if (!el) return;
    const svgEl = el.querySelector("svg");
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / (H + 24);
    const x = Math.max(70, Math.min(rect.width - 70, svgX * scaleX));
    const y = svgY * scaleY - 12;
    setActiveMarker(sd);
    setMarkerPos({ x, y });
  }

  function handlePinHover(ann: ChartAnnotation, svgX: number, svgY: number) {
    const el = wrapperRef.current;
    if (!el) return;
    const svgEl = el.querySelector("svg");
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / (H + 24);
    const x = Math.max(70, Math.min(rect.width - 70, svgX * scaleX));
    const y = svgY * scaleY - 12;
    setActivePin(ann);
    setTooltipPos({ x, y });
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }} onPointerLeave={() => { setActivePin(null); setActiveMarker(null); }}>
      <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A673F1" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#A673F1" stopOpacity={0.02} />
          </linearGradient>
          <filter id="pinGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="pinBlur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {[1, 2, 3, 4, 5].map((s) => (
          <g key={s}>
            <line x1={PX} x2={W - PX} y1={toY(s)} y2={toY(s)} stroke="var(--surface-3)" strokeWidth={1} strokeDasharray="4 3" />
            <image
              href={moodIconUrl(SCORE_MOODS[s], moodPack, iconFormat)}
              x={PX - 28}
              y={toY(s) - 10}
              width={20}
              height={20}
            />
          </g>
        ))}

        {areaPath && <path d={areaPath} fill="url(#lineGrad)" />}

        {/* Special day markers */}
        {specialDays && specialDays.map((sd) => {
          const idx = trend.findIndex((d) => d.date === sd.date);
          if (idx < 0) return null;
          const x = toX(idx);
          const color = sd.type === "holiday" ? "#F43F5E" : "#3B82F6";
          return (
            <g key={`marker-${sd.date}-${sd.type}`}>
              <line x1={x} x2={x} y1={PY - 2} y2={PY + chartH} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
              <circle cx={x} cy={PY - 6} r={7} fill={color} opacity={0.15} />
              <text x={x} y={PY - 3} textAnchor="middle" fontSize={9}>{sd.emoji}</text>
              <circle
                cx={x} cy={PY - 6} r={12} fill="transparent" cursor="pointer"
                onPointerEnter={() => handleMarkerHover(sd, x, PY - 6)}
                onPointerDown={() => {
                  if (activeMarker?.date === sd.date) setActiveMarker(null);
                  else handleMarkerHover(sd, x, PY - 6);
                }}
              />
            </g>
          );
        })}

        {linePath && (
          <path d={linePath} fill="none" stroke="#A673F1" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <circle key={p.idx} cx={p.x} cy={p.y} r={isLast ? 6 : 4} fill={isLast ? "#A673F1" : "#fff"} stroke="#A673F1" strokeWidth={2.5} />
          );
        })}

        {/* AI Annotation Pins */}
        {pinAnnotations && points.map((p) => {
          const ann = annotationMap.get(p.idx);
          if (!ann) return null;
          return (
            <g key={`pin-${p.idx}`} filter="url(#pinGlow)">
              <circle cx={p.x} cy={p.y} r={10} fill="none" stroke="#A673F1" strokeWidth={1.5} opacity={0.4}>
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={p.x} cy={p.y} r={5} fill="#A673F1" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={8} fill="#A673F1">✦</text>
              <circle
                cx={p.x} cy={p.y} r={14} fill="transparent" cursor="pointer"
                onPointerEnter={() => handlePinHover(ann, p.x, p.y)}
                onPointerDown={() => {
                  if (activePin?.dateKey === ann.dateKey) setActivePin(null);
                  else handlePinHover(ann, p.x, p.y);
                }}
              />
            </g>
          );
        })}

        {/* Free tier ghost pin */}
        {tier !== "premium" && points.length > 2 && (() => {
          const ghostIdx = Math.floor(points.length * 0.6);
          const gp = points[ghostIdx];
          if (!gp) return null;
          return (
            <g filter="url(#pinBlur)" opacity={0.5}>
              <circle cx={gp.x} cy={gp.y} r={10} fill="none" stroke="#C9B8E8" strokeWidth={1.5} />
              <circle cx={gp.x} cy={gp.y} r={5} fill="#C9B8E8" />
              <text x={gp.x} y={gp.y - 10} textAnchor="middle" fontSize={8} fill="#C9B8E8">✦</text>
            </g>
          );
        })()}

        {labels.map((label, i) =>
          label ? (
            <text key={i} x={toX(i)} y={H + 16} textAnchor="middle" fontSize={period === "year" ? 9 : 11} fill="var(--ink-3, #999)">
              {label}
            </text>
          ) : null,
        )}
      </svg>

      {/* Tooltip */}
      {activePin && tooltipPos && (
        <div style={{
          position: "absolute",
          left: tooltipPos.x,
          top: tooltipPos.y,
          transform: "translateX(-50%) translateY(-100%)",
          background: "#1A1320",
          color: "#fff",
          borderRadius: 10,
          padding: "6px 10px",
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.4,
          maxWidth: 180,
          whiteSpace: "pre-wrap" as const,
          pointerEvents: "none" as const,
          zIndex: 20,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}>
          {locale === "th" ? activePin.labelTh : activePin.labelEn}
          {activePin.tagRefs.length > 0 && (
            <div style={{ marginTop: 3, fontSize: 12, opacity: 0.7 }}>
              {activePin.tagRefs.join(" ")}
            </div>
          )}
        </div>
      )}

      {/* Marker tooltip */}
      {activeMarker && markerPos && (
        <div style={{
          position: "absolute",
          left: markerPos.x,
          top: markerPos.y,
          transform: "translateX(-50%) translateY(-100%)",
          background: activeMarker.type === "holiday" ? "#F43F5E" : "#3B82F6",
          color: "#fff",
          borderRadius: 10,
          padding: "6px 10px",
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.4,
          maxWidth: 200,
          whiteSpace: "nowrap" as const,
          pointerEvents: "none" as const,
          zIndex: 20,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}>
          {activeMarker.emoji} {locale === "th" ? (activeMarker.labelTh ?? activeMarker.label) : activeMarker.label}
        </div>
      )}

      {/* Free tier upgrade teaser */}
      {tier !== "premium" && points.length > 2 && (
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <a href="/pricing" style={{
            background: "rgba(166,115,241,0.1)",
            border: "1px solid rgba(166,115,241,0.25)",
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 13,
            fontWeight: 700,
            color: "#A673F1",
            textDecoration: "none",
          }}>
            ✦ {locale === "th" ? "ปลดล็อก AI Annotations" : "Unlock AI Annotations"} — PRO
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Donut Chart ───────────────────────────────────────── */

function MoodDonut({ distribution, period, locale }: { distribution: Record<string, number>; period: Period; locale: string }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const R = 44;
  const stroke = 14;
  const periodLabels: Record<Period, string> = { week: "7d", month: "30d", year: "1y" };

  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink-3)">{periodLabels[period]}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="var(--ink-3)">MOODS</text>
      </svg>
    );
  }

  const segments: React.ReactElement[] = [];
  let angle = -90;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);

  sorted.forEach(([moodId, count]) => {
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
      <path key={moodId} d={`M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={mood?.color ?? "#ccc"} strokeWidth={stroke} strokeLinecap="round" />,
    );
    angle += sweep;
  });

  const topMoodId = sorted[0]?.[0];
  const topMood = moodById(topMoodId ?? "neutral");
  const topPct = total > 0 && sorted[0] ? Math.round((sorted[0][1] / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block" }}>
        {segments}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink-3)">{periodLabels[period]}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="var(--ink-3)">MOODS</text>
      </svg>
      {topMood && (
        <div style={{ fontSize: 14, color: "var(--ink-2, #666)", textAlign: "center" }}>
          {topMood.emoji} {locale === "th" ? topMood.labelTh : topMood.label} {topPct}%
        </div>
      )}
    </div>
  );
}

/* ── Activity Bar ──────────────────────────────────────── */

function ActivityBar({ impact }: { impact: number }) {
  const barW = 100;
  const mid = barW / 2;
  const len = (Math.abs(impact) / 100) * mid;
  const isPositive = impact >= 0;
  const x = isPositive ? mid : mid - len;

  return (
    <svg viewBox={`0 0 ${barW} 10`} width={barW} height={10} style={{ flexShrink: 0 }}>
      <rect x={0} y={3} width={barW} height={4} rx={2} fill="#F2F0F5" />
      <line x1={mid} y1={0} x2={mid} y2={10} stroke="var(--hairline-2)" strokeWidth={1} />
      <rect x={x} y={2} width={len} height={6} rx={3} fill={isPositive ? "var(--mint)" : "#F4A8A8"} />
    </svg>
  );
}

/* ── Main Component ────────────────────────────────────── */

export function StatsShell({ tier = "free", moodPack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: { tier?: Tier; moodPack?: string; iconFormat?: string }) {
  const locale = useLocale();
  const t = useTranslations("stats");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [yearBlocked, setYearBlocked] = useState(false);
  const [insight, setInsight] = useState<{ headline: string; summary: string; locked?: boolean } | null>(null);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    trackStatsView(period);
    let alive = true;
    setLoading(true);
    setYearBlocked(false);
    fetch(`/api/stats?period=${period}&locale=${locale}`)
      .then((r) => r.json() as Promise<StatsData>)
      .then((data) => {
        if (!alive) return;
        if (data.premiumRequired) {
          setYearBlocked(true);
          setPeriod("month");
        } else {
          setStats(data as StatsData);
          if (data.moodTrend?.length) {
            const dates = data.moodTrend.map((d: { date: string }) => d.date);
            const months = new Set(dates.map((d: string) => d.slice(0, 7)));
            Promise.all(
              [...months].map((ym: string) =>
                fetch(`/api/events?year=${ym.slice(0, 4)}&month=${parseInt(ym.slice(5), 10)}`)
                  .then((r) => (r.ok ? r.json() : { events: [] }))
                  .then((d) => (d as { events: SpecialDay[] }).events),
              ),
            ).then((arrays) => {
              if (alive) setSpecialDays(arrays.flat());
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [period]);

  useEffect(() => {
    if (tier !== "premium") return;
    let alive = true;
    fetch(`/api/insights?locale=${locale}&cacheOnly=1`)
      .then((r) => r.ok ? r.json() as Promise<Record<string, unknown>> : null)
      .then((json) => {
        if (!alive || !json || json.empty || json.tooFewEntries) return;
        setInsight({ headline: json.headline as string, summary: json.summary as string, locked: json.locked as boolean | undefined });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale, tier]);

  const trend = stats?.moodTrend ?? [];
  const distribution = stats?.distribution ?? {};
  const avgScore = stats?.avgScore;
  const avgDelta = stats?.avgScoreDelta;
  const bestDay = stats?.bestDay;
  const activityImpact = stats?.activityImpact ?? [];

  const canShare = !!stats && (stats.total ?? 0) >= MIN_ENTRIES;
  const shareData: ShareCardData = {
    streak: stats?.streak ?? 0,
    total: stats?.total ?? 0,
    distribution,
    topMoodId:
      Object.entries(distribution)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? stats?.todayMood?.moodId ?? null,
    avgScore: avgScore ?? null,
  };

  const avgEmoji = avgScore != null ? scoreToEmoji(avgScore) : "";
  const bestDayName = bestDay
    ? new Date(bestDay.date).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "long" })
    : "---";
  const bestDayEntryCount = bestDay?.entries ?? 0;

  const PERIODS: Period[] = ["week", "month", "year"];
  const periodScopeLabel: Record<Period, string> = {
    week: t("last7"),
    month: t("last30"),
    year: t("last365"),
  };
  const deltaLabel: Record<Period, string> = {
    week: t("vsLastWeek"),
    month: t("vsLastMonth"),
    year: t("vsLastYear"),
  };

  return (
    <>
      {/* ── HEADER ─── */}
      <section className="mb-5 fade-in" style={{ paddingTop: 8 }}>
        <div className="flex items-center justify-between stats-header">
          <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 800, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em" }}>{t("title")}</h1>
          <div className="flex items-center gap-2">
          {canShare && (
            <button
              onClick={() => setShareOpen(true)}
              aria-label={locale === "th" ? "แชร์การ์ดอารมณ์" : "Share mood card"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "var(--primary-bg, rgba(166,115,241,0.12))",
                color: "#A673F1",
              }}
            >
              <span aria-hidden>📤</span>
              <span>{locale === "th" ? "แชร์" : "Share"}</span>
            </button>
          )}
          <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 12, padding: 3, gap: 2 }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (p === "year" && tier !== "premium") {
                    setYearBlocked(true);
                    return;
                  }
                  setPeriod(p);
                }}
                style={{
                  padding: "6px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: period === p ? "var(--surface)" : "transparent",
                  color: period === p ? "var(--ink, #1a1a1a)" : "var(--ink-3, #999)",
                  boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  opacity: p === "year" && tier !== "premium" ? 0.5 : 1,
                }}
              >
                {t(p)}
              </button>
            ))}
          </div>
          </div>
        </div>
        {yearBlocked && (
          <a
            href="/pricing"
            className="fade-in"
            style={{
              display: "block", marginTop: 8,
              padding: "8px 14px",
              background: "var(--surface-2)",
              color: "#A673F1",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            {t("unlockYear")}
          </a>
        )}
      </section>

      {loading ? (
        <LoadingSkeleton />
      ) : !stats || (stats.total ?? 0) < 7 ? (
        <TooFewEntries total={stats?.total ?? 0} locale={locale} />
      ) : (
        <>
          {/* ── AI INSIGHTS SUMMARY ─── */}
          <section className="mb-5 fade-in">
            <div
              style={{
                borderRadius: 22,
                padding: "22px 20px 20px",
                background: "var(--hero-grad)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "#A673F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple)", letterSpacing: "0.5px" }}>
                  {t("viewInsights").toUpperCase()} · {t("week").toUpperCase()}
                </span>
                {tier !== "premium" && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", background: "var(--primary-bg)", borderRadius: 6, padding: "2px 6px", marginLeft: "auto" }}>
                    PRO
                  </span>
                )}
              </div>

              {insight && tier === "premium" ? (
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "var(--ink)",
                    marginBottom: 16,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}
                >
                  {insight.summary}
                </p>
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 16 }}>
                  {t("viewInsightsBody")}
                </p>
              )}

              <Link
                href={"/insights" as "/"}
                className="flex items-center gap-1.5"
                style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", textDecoration: "none" }}
              >
                {locale === "th" ? "ดูเพิ่มเติม" : "Tell me more"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              {insight && tier === "premium" && (
                <div style={{ marginTop: 12 }}>
                  <AiDisclaimer variant="analysis" />
                </div>
              )}
            </div>
          </section>

          {/* ── 4-COLUMN STAT CARDS ─── */}
          <section className="mb-5 fade-in grid-stats-4" style={{ animationDelay: "30ms" }}>
            {(() => {
              const distEntries = Object.entries(distribution).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
              const distTotal = distEntries.reduce((s, [, v]) => s + v, 0);
              const topMoodEntry = distEntries[0];
              const topMoodObj = topMoodEntry ? moodById(topMoodEntry[0]) : null;
              const topMoodPct = distTotal > 0 && topMoodEntry ? Math.round((topMoodEntry[1] / distTotal) * 100) : 0;
              const topMoodLabel = topMoodObj
                ? `${locale === "th" ? topMoodObj.labelTh : topMoodObj.label} · ${topMoodPct}%`
                : "";

              return [
                { l: t("avgMood"), v: avgScore != null ? avgScore.toFixed(1) : "—", d: avgDelta ? `${avgDelta > 0 ? "+" : ""}${avgDelta.toFixed(1)} ↑` : "", dc: "var(--mint)" },
                { l: t("entries") || "Entries", v: String(stats?.total ?? 0), d: periodScopeLabel[period], dc: "var(--ink-3)" },
                { l: "Streak", v: `${stats?.streak ?? 0} 🔥`, d: periodScopeLabel[period], dc: "var(--ink-3)" },
                { l: locale === "th" ? "อารมณ์เด่น" : "Top mood", v: avgEmoji || "—", d: topMoodLabel, dc: "var(--ink-3)" },
              ].map(s => (
                <div key={s.l} className="card" style={{ padding: 18 }}>
                  <div className="w-eyebrow">{s.l}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>{s.v}</div>
                  {s.d && <div style={{ fontSize: 14, color: s.dc, fontWeight: 600, marginTop: 2 }}>{s.d}</div>}
                </div>
              ));
            })()}
          </section>

          {/* ── TREND LINE + MOOD MIX (side by side like design) ─── */}
          <section className="mb-5 fade-in" style={{ animationDelay: "40ms" }}>
            <div className="stats-2col">
              {/* Mood Line Chart */}
              <div style={CARD}>
                <div className="flex items-center justify-between mb-3">
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                    {locale === "th" ? "แนวโน้มอารมณ์" : "Mood Trend"}
                  </h2>
                  <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{periodScopeLabel[period]}</span>
                </div>
                <MoodLineChart trend={trend} period={period} locale={locale} moodPack={moodPack} iconFormat={iconFormat} annotations={stats?.annotations} tier={tier} specialDays={specialDays} />
              </div>

              {/* Special Days in period */}
              {specialDays.length > 0 && (
                <div style={CARD}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.3, textTransform: "uppercase" as const, marginBottom: 10 }}>
                    {locale === "th" ? "วันสำคัญในช่วงนี้" : "Special days"}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {specialDays.filter((sd) => trend.some((d) => d.date === sd.date)).map((sd) => (
                      <span
                        key={`${sd.date}-${sd.type}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 12px", borderRadius: 100,
                          background: sd.type === "holiday" ? "#FFF0F3" : "#EFF6FF",
                          fontSize: 14, fontWeight: 600,
                          color: sd.type === "holiday" ? "#BE123C" : "#1D4ED8",
                        }}
                      >
                        <span>{sd.emoji}</span>
                        {locale === "th" ? (sd.labelTh ?? sd.label) : sd.label}
                        <span style={{ fontSize: 12, opacity: 0.6 }}>
                          {parseInt(sd.date.slice(8), 10)}/{parseInt(sd.date.slice(5, 7), 10)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood Mix — stacked bar + featured mood + list */}
              <div style={CARD}>
                {(() => {
                  const distEntries = Object.entries(distribution).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
                  const distTotal = distEntries.reduce((s, [, v]) => s + v, 0);
                  const topEntry = distEntries[0];
                  const topMood = topEntry ? moodById(topEntry[0]) : null;
                  const topCount = topEntry?.[1] ?? 0;
                  const topPct = distTotal > 0 ? Math.round((topCount / distTotal) * 100) : 0;
                  const dayLabel = locale === "th" ? "วัน" : "days";

                  return (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{t("moodMix")}</h2>
                        <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
                          {distTotal} {t("entries")}
                        </span>
                      </div>

                      {/* Stacked color bar */}
                      {distTotal > 0 && (
                        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
                          {distEntries.map(([id, count]) => {
                            const m = moodById(id);
                            return (
                              <div
                                key={id}
                                style={{
                                  width: `${(count / distTotal) * 100}%`,
                                  background: m?.color ?? "#ccc",
                                  minWidth: 3,
                                }}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* Featured top mood */}
                      {topMood && (
                        <div
                          className="flex items-center gap-3"
                          style={{
                            marginBottom: 20,
                            background: "var(--accent-soft)",
                            borderRadius: 14,
                            padding: "14px 16px",
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: "50%",
                              background: topMood.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={moodIconUrl(topMood.id, moodPack, iconFormat)}
                              alt=""
                              width={32}
                              height={32}
                              style={{ width: 32, height: 32 }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>
                              {locale === "th" ? "อารมณ์หลัก" : "Top mood"}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                              {locale === "th" ? topMood.labelTh : topMood.label} · {topCount} {dayLabel}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                              {topPct}%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mood list — label above bar */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {distEntries.slice(0, 5).map(([id, count]) => {
                          const m = moodById(id);
                          if (!m) return null;
                          const pct = distTotal > 0 ? Math.round((count / distTotal) * 100) : 0;
                          return (
                            <div key={id}>
                              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                <img
                                  src={moodIconUrl(m.id, moodPack, iconFormat)}
                                  alt=""
                                  width={20}
                                  height={20}
                                  style={{ width: 20, height: 20, flexShrink: 0 }}
                                />
                                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                                  {locale === "th" ? m.labelTh : m.label}
                                </span>
                                <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
                                  {count} {dayLabel}
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 700, width: 32, textAlign: "right" }}>
                                  {pct}%
                                </span>
                              </div>
                              <div style={{ marginLeft: 28, height: 6, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: m.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* ── ACTIVITY IMPACT ─── */}
          <section className="mb-5 fade-in" style={{ animationDelay: "120ms" }}>
            {tier === "premium" ? (
            <div style={CARD}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{t("activityImpact")}</h2>
                <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
                  {locale === "th" ? `วิเคราะห์จาก ${stats?.total ?? 0} entries` : `Analyzed from ${stats?.total ?? 0} entries`}
                </span>
              </div>
              {activityImpact.length === 0 ? (
                <div style={{ fontSize: 14, color: "var(--ink-3)", textAlign: "center", padding: "16px 0" }}>
                  {t("noActivity")}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activityImpact.map((act) => {
                    const isPositive = act.impact >= 0;
                    const barPct = Math.min(Math.abs(act.impact) / 2, 50);
                    return (
                      <div key={act.tag} className="flex items-center gap-3">
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", width: 100, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          #{act.tag.replace(/^#/, "")}
                        </span>
                        <div style={{ flex: 1, position: "relative", height: 10 }}>
                          <div style={{ position: "absolute", inset: 0, borderRadius: 5, background: "var(--surface-3)" }} />
                          <div style={{ position: "absolute", top: 0, height: "100%", left: isPositive ? "50%" : undefined, right: isPositive ? undefined : "50%", width: `${barPct}%`, borderRadius: 5, background: isPositive ? "var(--mint, #85ECCB)" : "#F4A8A8" }} />
                          <div style={{ position: "absolute", top: -2, bottom: -2, left: "50%", width: 1, background: "var(--hairline-2)" }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isPositive ? "#2DA963" : "#E05A5A", width: 40, textAlign: "right", flexShrink: 0 }}>
                          {isPositive ? "+" : ""}{(act.impact / 100).toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            ) : (
            <div style={CARD}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-2">
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{t("activityImpact")}</h2>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", background: "var(--primary-bg)", borderRadius: 6, padding: "2px 6px" }}>
                    PRO
                  </span>
                </div>
              </div>
              <a href="/pricing" style={{ textDecoration: "none", display: "block" }}>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 12 }}>
                  {locale === "th" ? "ดูว่ากิจกรรมไหนทำให้อารมณ์ดีขึ้นหรือแย่ลง วิเคราะห์จากบันทึกของคุณ" : "See which activities lift or lower your mood, analyzed from your entries"}
                </p>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1" }}>
                  {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
                </span>
              </a>
            </div>
            )}
          </section>

        </>
      )}

      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        data={shareData}
        locale={locale}
      />
    </>
  );
}

/* ── Skeleton ──────────────────────────────────────────── */

const MIN_ENTRIES = 7;

function TooFewEntries({ total, locale }: { total: number; locale: string }) {
  const isTh = locale === "th";
  const remaining = Math.max(0, MIN_ENTRIES - total);
  const dots = Array.from({ length: MIN_ENTRIES }, (_, i) => i < total);

  return (
    <div className="fade-in" style={{ paddingTop: 8 }}>
      <div style={{
        background: "var(--surface)", border: "1.5px solid var(--hairline-2)", borderRadius: 22,
        padding: "40px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
          {isTh ? `ต้องการอีก ${remaining} วัน` : `${remaining} more day${remaining !== 1 ? "s" : ""} needed`}
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 20, lineHeight: 1.5 }}>
          {isTh
            ? `คุณบันทึก ${total} ครั้งแล้ว · ต้องครบ ${MIN_ENTRIES} ครั้งจึงจะเห็นกราฟและเทรนด์`
            : `You've logged ${total} time${total !== 1 ? "s" : ""} · Need ${MIN_ENTRIES} to see charts and trends`}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {dots.map((done, i) => (
            <div
              key={i}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700,
                background: done ? undefined : "#F2F0F5",
                color: done ? "#fff" : "var(--ink-3)",
              }}
            >
              {done ? (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: i === 0 ? "#F5A623" : i === 1 ? "#F7C948" : "#7FDCB0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                i + 1
              )}
            </div>
          ))}
        </div>

        <a
          href="/"
          style={{
            display: "inline-block", padding: "12px 28px", borderRadius: 16,
            background: "#FCA45B", color: "#fff",
            fontSize: 15, fontWeight: 700, textDecoration: "none",
          }}
        >
          {isTh ? "+ บันทึกวันนี้" : "+ Log today"}
        </a>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 fade-in">
      <div style={{ height: 120, borderRadius: 22, background: "var(--hero-grad)", opacity: 0.5 }} />
      <div style={{ height: 220, borderRadius: 24, background: "var(--surface-2, #F8F6FB)", opacity: 0.5 }} />
      <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 480 }}>
        <div style={{ height: 180, borderRadius: 24, background: "var(--surface-2)", opacity: 0.4 }} />
        <div style={{ height: 180, borderRadius: 24, background: "var(--surface-2)", opacity: 0.4 }} />
      </div>
      <div style={{ height: 200, borderRadius: 24, background: "var(--surface-2)", opacity: 0.3 }} />
    </div>
  );
}

/* ── Tag emoji heuristic ───────────────────────────────── */

function tagEmoji(tag: string): string {
  const map: Record<string, string> = {
    work: "💼", exercise: "🏃", coffee: "☕", friends: "👫", family: "👨‍👩‍👧",
    reading: "📖", music: "🎵", cooking: "🍳", shopping: "🛍️", travel: "✈️",
    meditation: "🧘", sleep: "😴", food: "🍔", rain: "🌧️", sunny: "☀️",
    meeting: "📋", study: "📚", game: "🎮", movie: "🎬", walk: "🚶",
  };
  const lower = tag.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return "🏷️";
}
