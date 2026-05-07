import { DEFAULT_MOOD_IDS } from "@/lib/default-moods";
import { moodIconUrl, DEFAULT_MOOD_PACK } from "@/lib/moods";

interface Props {
  moodId: string;
  emoji?: string | null;
  size?: number;
  pack?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Renders the pack SVG for default moods; falls back to the unicode emoji
// for custom (premium-created) moods or when an icon fails to load.
export function MoodIcon({
  moodId,
  emoji,
  size = 28,
  pack = DEFAULT_MOOD_PACK,
  className,
  style,
}: Props) {
  const isDefault = (DEFAULT_MOOD_IDS as readonly string[]).includes(moodId);

  if (!isDefault) {
    return (
      <span
        className={className}
        style={{ fontSize: size, lineHeight: 1, ...style }}
        aria-hidden
      >
        {emoji ?? "·"}
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={moodIconUrl(moodId, pack)}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: "block", ...style }}
      loading="lazy"
      decoding="async"
    />
  );
}
