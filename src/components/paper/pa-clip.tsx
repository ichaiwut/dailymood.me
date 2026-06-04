import type { CSSProperties } from "react";

/** Decorative metal paperclip (inline SVG). Absolutely positioned by the caller. */
export function PAClip({ style }: { style?: CSSProperties }) {
  return (
    <svg
      width="30"
      height="57"
      viewBox="0 0 34 64"
      fill="none"
      aria-hidden
      style={{ position: "absolute", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.22))", ...style }}
    >
      <path
        d="M24 14v30a8 8 0 0 1-16 0V12a5 5 0 0 1 10 0v30a2.4 2.4 0 0 1-4.8 0V16"
        stroke="#B7B2BC"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
