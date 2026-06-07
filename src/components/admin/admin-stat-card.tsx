import { COLORS } from "./admin-ui";

type Tab = "peach" | "purple" | "mint" | "yellow" | "lav" | "ink";

export function AdminStatCard({
  label,
  value,
  sub,
  color,
  delta,
  deltaLabel,
  tab = "peach",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delta?: number;
  deltaLabel?: string;
  /** folder-tab accent colour */
  tab?: Tab;
}) {
  const deltaColor =
    delta == null || delta === 0
      ? "var(--w-ink-3)"
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <span
        className={`pa-tab ${tab}`}
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "7px 15px 9px",
        }}
      >
        {label}
      </span>
      <div
        className="pa-sheet"
        style={{ alignSelf: "stretch", padding: "15px 18px 17px" }}
      >
        <div
          style={{
            fontSize: 27,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            color: color ?? "var(--w-ink)",
          }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {deltaText && (
          <div style={{ fontSize: 11, color: deltaColor, fontWeight: 800, marginTop: 4 }}>
            {deltaText}
            {deltaLabel && ` ${deltaLabel}`}
          </div>
        )}
        {sub && (
          <div style={{ fontSize: 12, color: "var(--w-ink-3)", marginTop: 4 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}
