import type { ReactNode } from "react";

/** Marker-pen highlight behind a word — a rounded colour block tilted slightly. */
export function PAMark({ children, color = "var(--peach)" }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ position: "relative", whiteSpace: "nowrap", padding: "0 .1em" }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: ".05em",
          top: ".2em",
          background: color,
          transform: "rotate(-1.2deg)",
          borderRadius: "6px 10px 7px 9px",
          zIndex: 0,
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
}
