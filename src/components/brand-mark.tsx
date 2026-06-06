import type { CSSProperties } from "react";
import { DAILYMOOD_MARK_PNG } from "@/lib/brand-logo";

/**
 * The DailyMood gradient smiley mark. Decorative by default (alt="") since it's
 * paired with a "DailyMood" wordmark wherever it's used. Renders the inlined
 * data-URI PNG so it's identical (and canvas-safe) in the header and the
 * social share card.
 */
export function BrandMark({ size = 26, style }: { size?: number; style?: CSSProperties }) {
  return (
    <img
      src={DAILYMOOD_MARK_PNG}
      alt=""
      width={size}
      height={size}
      decoding="sync"
      style={{ display: "block", width: size, height: size, objectFit: "contain", ...style }}
    />
  );
}
