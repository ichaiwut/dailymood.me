import type { CSSProperties } from "react";
import { moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";

/**
 * Mood sticker — a coloured disc with a white ring holding the mood face.
 * Uses the app's real mood icon so the face matches the rest of the product.
 *
 * By default it resolves the icon from the default pack (used by /articles).
 * Pass `pack`/`iconFormat` to honour a user's selected pack, or `iconKey` to
 * render a custom (user-created) mood's uploaded icon.
 */
export function PASticker({
  moodId,
  color,
  size = 54,
  borderWidth = 4,
  pack,
  iconFormat,
  iconKey,
  className,
  style,
}: {
  moodId: string;
  color: string;
  size?: number;
  borderWidth?: number;
  pack?: string;
  iconFormat?: string;
  iconKey?: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  const face = Math.round(size * 0.78);
  const src = iconKey ? `${R2_PUBLIC_URL}/${iconKey}` : moodIconUrl(moodId, pack, iconFormat);
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
      <img src={src} alt="" width={face} height={face} style={{ display: "block" }} />
    </div>
  );
}
