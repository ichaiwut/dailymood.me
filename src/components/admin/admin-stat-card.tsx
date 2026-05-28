import { A, COLORS } from "./admin-ui";

export function AdminStatCard({
  label,
  value,
  sub,
  color,
  delta,
  deltaLabel,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delta?: number;
  deltaLabel?: string;
}) {
  const deltaColor =
    delta == null || delta === 0
      ? "var(--ink-3)"
      : delta > 0
        ? COLORS.green
        : COLORS.red;

  const deltaText =
    delta == null
      ? null
      : delta > 0
        ? `+${delta.toLocaleString()}`
        : delta.toLocaleString();

  return (
    <div style={A.card}>
      <div style={A.eyebrow}>{label}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          marginTop: 4,
          letterSpacing: "-0.02em",
          color: color ?? "var(--ink)",
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {deltaText && (
        <div
          style={{
            fontSize: 11,
            color: deltaColor,
            fontWeight: 700,
            marginTop: 2,
          }}
        >
          {deltaText}
          {deltaLabel && ` ${deltaLabel}`}
        </div>
      )}
      {sub && (
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
