import type { CSSProperties } from "react";

const CARD: CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline)",
  borderRadius: 16,
  padding: "20px 24px",
};

export function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div style={CARD}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: color ?? "var(--ink)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
