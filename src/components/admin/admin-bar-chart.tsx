"use client";

import { A } from "./admin-ui";

interface BarData {
  label: string;
  bars: { value: number; color: string; key: string }[];
}

interface Legend {
  key: string;
  color: string;
  label: string;
}

export function AdminBarChart({
  data,
  height = 180,
  legend,
  title,
}: {
  data: BarData[];
  height?: number;
  legend?: Legend[];
  title?: string;
}) {
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
            color: "var(--ink-3)",
            fontSize: 14,
          }}
        >
          ไม่มีข้อมูล
        </div>
      </div>
    );
  }

  const maxVal = Math.max(1, ...data.map((d) => d.bars.reduce((s, b) => s + b.value, 0)));
  const barWidth = Math.max(6, Math.min(16, Math.floor(600 / data.length) - 6));
  const step = Math.floor(800 / data.length);

  return (
    <div style={{ ...A.card, padding: 22 }}>
      {(title || legend) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          {title && <h3 style={{ ...A.sectionTitle, marginBottom: 0 }}>{title}</h3>}
          {legend && (
            <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
              {legend.map((l) => (
                <span
                  key={l.key}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 3,
                      background: l.color,
                      borderRadius: 1,
                    }}
                  />
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <svg
        viewBox={`0 0 ${data.length * step + 16} ${height}`}
        style={{ width: "100%", height }}
      >
        {data.map((d, i) => {
          let yOffset = 0;
          return (
            <g key={i}>
              {d.bars.map((bar) => {
                const h = (bar.value / maxVal) * (height - 20);
                const y = height - h - yOffset;
                yOffset += h;
                return (
                  <rect
                    key={bar.key}
                    x={i * step + 8}
                    y={y}
                    width={barWidth}
                    height={h}
                    rx={2}
                    fill={bar.color}
                    opacity={i === data.length - 1 ? 1 : 0.6}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
