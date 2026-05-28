import type { CSSProperties } from "react";

type Variant = "premium" | "free" | "admin" | "success" | "warning" | "danger" | "info" | "neutral";

const STYLES: Record<Variant, CSSProperties> = {
  premium: {
    background: "linear-gradient(135deg, var(--peach), var(--purple))",
    color: "#fff",
  },
  free: {
    background: "var(--surface-2)",
    color: "var(--ink-2)",
  },
  admin: {
    background: "var(--ink)",
    color: "#fff",
  },
  success: {
    background: "rgba(46, 166, 125, 0.12)",
    color: "#2EA67D",
  },
  warning: {
    background: "rgba(229, 176, 90, 0.12)",
    color: "#B8860B",
  },
  danger: {
    background: "#FFF5F5",
    color: "#D45353",
  },
  info: {
    background: "rgba(166, 115, 241, 0.12)",
    color: "var(--purple-strong)",
  },
  neutral: {
    background: "var(--surface-2)",
    color: "var(--ink-3)",
  },
};

export function AdminBadge({
  variant = "neutral",
  children,
  style,
}: {
  variant?: Variant;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        ...STYLES[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: "active" | "paused" | "inactive" }) {
  const color =
    status === "active"
      ? "#39B58A"
      : status === "paused"
        ? "#E5B05A"
        : "#C4B8A8";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 50,
          background: color,
        }}
      />
      {status}
    </span>
  );
}
