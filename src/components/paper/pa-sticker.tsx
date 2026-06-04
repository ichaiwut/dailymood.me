import type { CSSProperties } from "react";
import { moodIconUrl } from "@/lib/moods";

/**
 * Mood sticker — a coloured disc with a white ring holding the article's
 * derived mood face. Uses the app's real mood icon (moodIconUrl) so the face
 * matches the rest of the product; the disc colour is the article's tone hue.
 */
export function PASticker({
  moodId,
  color,
  size = 54,
  borderWidth = 4,
  className,
  style,
}: {
  moodId: string;
  color: string;
  size?: number;
  borderWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const face = Math.round(size * 0.78);
  return (
    <div
      aria-hidden
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: color,
        border: `${borderWidth}px solid #fff`,
        boxShadow: "0 10px 22px -8px rgba(0,0,0,.3)",
        flexShrink: 0,
        ...style,
      }}
    >
      <img src={moodIconUrl(moodId)} alt="" width={face} height={face} style={{ display: "block" }} />
    </div>
  );
}
