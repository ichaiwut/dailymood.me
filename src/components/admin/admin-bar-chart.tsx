"use client";

import { useState } from "react";
import { A, COLORS } from "./admin-ui";

interface BarData {
  label: string;
  bars: { value: number; color: string; key: string }[];
}

interface Legend {
  key: string;
  color: string;
  label: string;
}

const TH_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** "06-14" → "14 มิ.ย." ; passes other label shapes through unchanged. */
function thaiDayMonth(label: string): string {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(label);
  if (!m) return label;
  const mon = Number(m[1]) - 1;
  const day = Number(m[2]);
  if (mon < 0 || mon > 11) return label;
  return `${day} ${TH_MONTHS[mon]}`;
}

const VW = 1000; // viewBox width — bars stretch to fill via preserveAspectRatio="none"

export function AdminBarChart({
  data,
  height = 180,
  legend,
  title,
  unit,
}: {
  data: BarData[];
  height?: number;
  legend?: Legend[];
  title?: string;
  /** noun for the "today" callout + tooltip totals (e.g. "คน", "ครั้ง").
   *  When set, a summary headline is shown above the chart. */
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div style={{ ...A.card, padding: 22 }}>
        {title && <h3 style={{ ...A.sectionTitle, marginBottom: 14 }}>{title}</h3>}
        <div
          style={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--w-ink-3)",
            fontSize: 14,
          }}
        >
          ไม่มีข้อมูล
        </div>
      </div>
    );
  }

  const totals = data.map((d) => d.bars.reduce((s, b) => s + b.value, 0));
  const maxVal = Math.max(1, ...totals);
  const n = data.length;
  const step = VW / n;
  const barW = Math.min(step * 0.6, 26);
  const TOP = 10; // headroom above the tallest bar (viewBox units)

  // "today" summary (latest point vs the period average)
  const latest = totals[n - 1] ?? 0;
  const avg = totals.reduce((s, v) => s + v, 0) / n;
  const deltaPct = avg > 0 ? Math.round(((latest - avg) / avg) * 100) : 0;
  const deltaColor = deltaPct > 0 ? COLORS.green : deltaPct < 0 ? COLORS.red : "var(--w-ink-3)";

  // axis ticks: first / middle / last
  const midIdx = Math.floor((n - 1) / 2);
  const legendMap = new Map((legend ?? []).map((l) => [l.key, l.label]));

  function barCenterPct(i: number) {
    return ((i + 0.5) / n) * 100;
  }

  return (
    <div style={{ ...A.card, padding: 22 }}>
      {(title || legend) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: unit ? 12 : 18,
          }}
        >
          {title && <h3 style={{ ...A.sectionTitle, marginBottom: 0 }}>{title}</h3>}
          {legend && (
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--w-ink-2)" }}>
              {legend.map((l) => (
                <span key={l.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 3, background: l.color, borderRadius: 1 }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* "today" callout */}
      {unit && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 14, color: "var(--w-ink-3)", fontWeight: 700 }}>วันนี้</span>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--w-ink)" }}>
            {latest.toLocaleString()}
          </span>
          <span style={{ fontSize: 14, color: "var(--w-ink-3)" }}>{unit}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: deltaColor }}>
            {deltaPct > 0 ? "↑" : deltaPct < 0 ? "↓" : "•"} {deltaPct > 0 ? "+" : ""}
            {deltaPct}%
          </span>
          <span style={{ fontSize: 14, color: "var(--w-ink-3)" }}>เทียบค่าเฉลี่ย {n} วัน</span>
        </div>
      )}

      {/* chart area */}
      <div
        style={{ position: "relative", width: "100%", height }}
        onMouseLeave={() => setHover(null)}
      >
        {/* max-value reference label */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--w-ink-3)",
            pointerEvents: "none",
          }}
        >
          {maxVal.toLocaleString()}
        </div>

        <svg
          viewBox={`0 0 ${VW} ${height}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height, display: "block" }}
        >
          {/* gridlines: baseline + mid + max */}
          {[0, 0.5, 1].map((f) => {
            const y = TOP + (1 - f) * (height - TOP);
            return (
              <line
                key={f}
                x1={0}
                x2={VW}
                y1={y}
                y2={y}
                stroke="var(--w-rule)"
                strokeWidth={1}
                strokeDasharray={f === 0 ? undefined : "4 5"}
              />
            );
          })}

          {data.map((d, i) => {
            const x = i * step + (step - barW) / 2;
            const isActive = hover === i || (hover === null && i === n - 1);
            let yOffset = 0;
            return (
              <g key={i}>
                {d.bars.map((bar) => {
                  const h = (bar.value / maxVal) * (height - TOP);
                  const y = height - h - yOffset;
                  yOffset += h;
                  return (
                    <rect
                      key={bar.key}
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(0, h)}
                      rx={3}
                      fill={bar.color}
                      opacity={isActive ? 1 : 0.5}
                      style={{ transition: "opacity 120ms" }}
                    />
                  );
                })}
                {/* generous transparent hit area for the whole column */}
                <rect
                  x={i * step}
                  y={0}
                  width={step}
                  height={height}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setHover((p) => (p === i ? null : i))}
                />
              </g>
            );
          })}
        </svg>

        {/* tooltip */}
        {hover !== null && (
          <div
            style={{
              position: "absolute",
              top: 4,
              left: `${barCenterPct(hover)}%`,
              transform: `translateX(${hover <= 1 ? "0" : hover >= n - 2 ? "-100%" : "-50%"})`,
              background: "var(--w-surface)",
              border: "1px solid var(--w-rule)",
              borderRadius: 10,
              boxShadow: "0 12px 28px -12px rgba(60, 40, 20, .5)",
              padding: "8px 12px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 2,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-ink)", marginBottom: 2 }}>
              {thaiDayMonth(data[hover].label)}
            </div>
            {data[hover].bars.length > 1 &&
              data[hover].bars.map((b) => (
                <div
                  key={b.key}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--w-ink-2)" }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
                  {legendMap.get(b.key) ?? b.key} · {b.value.toLocaleString()}
                </div>
              ))}
            <div style={{ fontSize: 14, color: "var(--w-ink)", fontWeight: 700, marginTop: data[hover].bars.length > 1 ? 4 : 0 }}>
              {totals[hover].toLocaleString()} {unit ?? ""}
            </div>
          </div>
        )}
      </div>

      {/* date ticks */}
      <div style={{ position: "relative", height: 20, marginTop: 6 }}>
        <span style={{ position: "absolute", left: 0, fontSize: 14, color: "var(--w-ink-3)" }}>
          {thaiDayMonth(data[0].label)}
        </span>
        {n > 2 && (
          <span
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 14,
              color: "var(--w-ink-3)",
            }}
          >
            {thaiDayMonth(data[midIdx].label)}
          </span>
        )}
        {n > 1 && (
          <span style={{ position: "absolute", right: 0, fontSize: 14, color: "var(--w-ink-3)" }}>
            {thaiDayMonth(data[n - 1].label)}
          </span>
        )}
      </div>
    </div>
  );
}
