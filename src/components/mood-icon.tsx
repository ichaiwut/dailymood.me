import { DEFAULT_MOOD_IDS } from "@/lib/default-moods";
import { moodIconUrl, DEFAULT_MOOD_PACK } from "@/lib/moods";

interface Props {
  moodId: string;
  emoji?: string | null;
  size?: number;
  pack?: string;
  iconFormat?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MoodIcon({
  moodId,
  emoji,
  size = 28,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
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
      src={moodIconUrl(moodId, pack, iconFormat)}
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
