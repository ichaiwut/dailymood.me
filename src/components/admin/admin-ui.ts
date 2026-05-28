import type { CSSProperties } from "react";

export const A = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--hairline)",
    borderRadius: 14,
    padding: 24,
  } satisfies CSSProperties,

  cardFlush: {
    background: "var(--surface)",
    border: "1px solid var(--hairline)",
    borderRadius: 14,
    overflow: "hidden",
  } satisfies CSSProperties,

  th: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    color: "var(--ink-3)",
    padding: "10px 14px",
    textAlign: "left" as const,
    borderBottom: "1px solid var(--hairline)",
    background: "var(--surface-2)",
  } satisfies CSSProperties,

  td: {
    padding: "10px 14px",
    fontSize: 14,
    color: "var(--ink)",
    borderBottom: "1px solid var(--hairline)",
    verticalAlign: "middle" as const,
  } satisfies CSSProperties,

  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "var(--ink)",
    margin: 0,
  } satisfies CSSProperties,

  pageSubtitle: {
    fontSize: 14,
    color: "var(--ink-3)",
    margin: "4px 0 0",
  } satisfies CSSProperties,

  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--ink)",
    margin: 0,
  } satisfies CSSProperties,

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "var(--ink-3)",
  } satisfies CSSProperties,

  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    border: "none",
    background: "var(--peach)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  } satisfies CSSProperties,

  btnInk: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    border: "none",
    background: "var(--ink)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  } satisfies CSSProperties,

  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    border: "1px solid var(--hairline)",
    background: "transparent",
    color: "var(--ink)",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  } satisfies CSSProperties,

  btnDanger: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid #FCC",
    background: "#FFF5F5",
    color: "#D45353",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  } satisfies CSSProperties,

  btnSmall: {
    height: 30,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid var(--hairline)",
    background: "transparent",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  } satisfies CSSProperties,

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
    marginBottom: 18,
  } satisfies CSSProperties,

  filterBar: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    alignItems: "center",
  } satisfies CSSProperties,

  input: {
    height: 42,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid var(--hairline)",
    background: "#fff",
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
