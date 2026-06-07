import type { CSSProperties } from "react";

/* ═══ Admin Desk · Paper Desk styling ═══
   Shared style constants for the admin back-office, reskinned to the app-wide
   "Paper Desk" system: warm paper sheets with a chunky offset shadow + folded
   top-left corner, theme-adaptive --w-* tokens (light cream / dark surfaces),
   and chunky paper buttons. Loose page titles stay on --ink (themed, dark-safe);
   text living *inside* a paper sheet uses --w-ink* so it reads on the sheet. */

const PAPER_SHADOW = "0 18px 40px -20px rgba(60, 40, 20, .45)";
const PAPER_SOFT = "0 6px 16px -8px rgba(60, 40, 20, .35)";

export const A = {
  /* paper sheet — folded top-left corner, warm shadow. The hairline keeps the
     sheet defined on dark backgrounds where the warm shadow is invisible. */
  card: {
    background: "var(--w-surface)",
    border: "1px solid var(--w-rule)",
    borderRadius: "4px 18px 18px 18px",
    padding: 24,
    boxShadow: PAPER_SHADOW,
  } satisfies CSSProperties,

  cardFlush: {
    background: "var(--w-surface)",
    border: "1px solid var(--w-rule)",
    borderRadius: "4px 18px 18px 18px",
    overflow: "hidden",
    boxShadow: PAPER_SHADOW,
  } satisfies CSSProperties,

  th: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "var(--w-ink-3)",
    padding: "11px 14px",
    textAlign: "left" as const,
    borderBottom: "1px solid var(--w-rule)",
    background: "var(--w-tint)",
  } satisfies CSSProperties,

  td: {
    padding: "11px 14px",
    fontSize: 14,
    color: "var(--w-ink)",
    borderBottom: "1px solid var(--w-rule)",
    verticalAlign: "middle" as const,
  } satisfies CSSProperties,

  /* loose page title — sits on the themed desk, stays --ink (dark-safe) */
  pageTitle: {
    fontSize: 25,
    fontWeight: 800,
    color: "var(--ink)",
    letterSpacing: "-0.02em",
    margin: 0,
  } satisfies CSSProperties,

  pageSubtitle: {
    fontSize: 14,
    color: "var(--ink-3)",
    margin: "5px 0 0",
  } satisfies CSSProperties,

  /* section title — lives inside a paper sheet */
  sectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "var(--w-ink)",
    letterSpacing: "-0.01em",
    margin: 0,
  } satisfies CSSProperties,

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "var(--w-ink-3)",
  } satisfies CSSProperties,

  /* chunky peach paper button (primary CTA) */
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 42,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "var(--peach)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 7px 0 -2px #d97f3b, 0 16px 24px -12px rgba(217, 127, 59, .7)",
  } satisfies CSSProperties,

  /* chunky ink paper button — flips with theme via --w-ink / --bg */
  btnInk: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 42,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "var(--w-ink)",
    color: "var(--bg)",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 7px 0 -2px rgba(0,0,0,.55), 0 16px 24px -14px rgba(0, 0, 0, .5)",
  } satisfies CSSProperties,

  /* paper-outline secondary button */
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid var(--w-rule-strong)",
    background: "var(--w-surface)",
    color: "var(--w-ink)",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: PAPER_SOFT,
  } satisfies CSSProperties,

  /* danger — soft red paper tint, no harsh border */
  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "6px 12px",
    borderRadius: 9,
    border: "none",
    background: "var(--w-tint-danger)",
    color: "var(--w-tint-danger-fg)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  } satisfies CSSProperties,

  /* small paper pill — used for pagination + inline actions */
  btnSmall: {
    height: 32,
    padding: "0 11px",
    borderRadius: 9,
    border: "none",
    background: "var(--w-surface)",
    color: "var(--w-ink-2)",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: PAPER_SOFT,
  } satisfies CSSProperties,

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 22,
  } satisfies CSSProperties,

  filterBar: {
    display: "flex",
    gap: 10,
    marginBottom: 18,
    alignItems: "center",
  } satisfies CSSProperties,

  input: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--w-rule-strong)",
    background: "var(--w-surface)",
    color: "var(--w-ink)",
    fontFamily: "inherit",
    fontSize: 14,
  } satisfies CSSProperties,
};

export const COLORS = {
  green: "#2EA67D",
  greenDot: "#39B58A",
  red: "#D45353",
  warn: "#E5B05A",
  inactive: "#C4B8A8",
  peachWarn: "#D97757",
} as const;
