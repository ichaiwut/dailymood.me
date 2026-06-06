import type { CSSProperties } from "react";

type Variant = "premium" | "free" | "admin" | "success" | "warning" | "danger" | "info" | "neutral";

const STYLES: Record<Variant, CSSProperties> = {
  /* brand accent — reads on both themes, kept literal */
  premium: {
    background: "linear-gradient(135deg, var(--peach), var(--purple))",
    color: "#fff",
  },
  free: {
    background: "var(--w-tint)",
    color: "var(--w-ink-2)",
  },
  admin: {
    background: "var(--w-ink)",
    color: "var(--bg)",
  },
  success: {
    background: "var(--w-tint-success)",
    color: "var(--w-tint-success-fg)",
  },
  warning: {
    background: "var(--w-tint-warning)",
    color: "var(--w-tint-warning-fg)",
  },
  danger: {
    background: "var(--w-tint-danger)",
    color: "var(--w-tint-danger-fg)",
  },
  info: {
    background: "var(--w-tint-info)",
    color: "var(--w-tint-info-fg)",
  },
  neutral: {
    background: "var(--w-tint)",
    color: "var(--w-ink-3)",
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
