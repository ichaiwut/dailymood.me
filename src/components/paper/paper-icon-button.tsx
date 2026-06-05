import type { CSSProperties, ReactNode } from "react";

/**
 * Paper Desk icon button — a 42px rounded-square with a hairline border, used
 * for the mic / photo / location controls in the Today composer and the Smart
 * Log modal. Renders as a <button> by default, or a <label> (for wrapping a
 * file <input>) when `asLabel` is set. Optional `badge` (e.g. "PRO") renders as
 * an ink pill pinned to the top-right corner.
 */
export function PaperIconButton({
  children,
  onClick,
  active = false,
  disabled = false,
  badge,
  asLabel = false,
  title,
  ariaLabel,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  asLabel?: boolean;
  title?: string;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const badgeEl = badge ? (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: -7,
        right: -7,
        background: "var(--w-ink)",
        color: "var(--bg)",
        fontSize: 11,
        fontWeight: 800,
        padding: "1px 5px",
        borderRadius: 100,
        letterSpacing: ".04em",
        lineHeight: 1.3,
      }}
    >
      {badge}
    </span>
  ) : null;

  if (asLabel) {
    return (
      <label
        className={`pa-icon-btn${active ? " active" : ""}`}
        title={title}
        aria-label={ariaLabel}
        style={{ opacity: disabled ? 0.45 : 1, cursor: disabled ? "default" : "pointer", ...style }}
      >
        {children}
        {badgeEl}
      </label>
    );
  }

  return (
    <button
      type="button"
      className={`pa-icon-btn${active ? " active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      style={{ opacity: disabled ? 0.45 : 1, ...style }}
    >
      {children}
      {badgeEl}
    </button>
  );
}
