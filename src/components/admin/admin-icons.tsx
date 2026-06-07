import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const defaults = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  style: { flexShrink: 0 },
});

export function IconHome({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M3 11L12 4L21 11V20H15V14H9V20H3Z" />
    </svg>
  );
}

export function IconUsers({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M1 21C1 16 5 14 9 14C13 14 17 16 17 21" />
      <circle cx="18" cy="9" r="3" />
      <path d="M21 21C21 18 19 16 17 15.5" />
    </svg>
  );
}

export function IconEdit({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M4 20H8L19 9L15 5L4 16Z" />
    </svg>
  );
}

export function IconHeart({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 20S4 14 4 9A4 4 0 0112 7A4 4 0 0120 9C20 14 12 20 12 20Z" />
    </svg>
  );
}

export function IconSparkle({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 3L13 9L19 10L13 11L12 17L11 11L5 10L11 9Z" />
    </svg>
  );
}

export function IconAi({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 3L13.5 9L20 12L13.5 15L12 21L10.5 15L4 12L10.5 9Z" />
    </svg>
  );
}

export function IconDoc({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M6 3H14L19 8V21H6Z" />
      <path d="M14 3V8H19" />
      <path d="M9 13H15M9 16.5H13" />
    </svg>
  );
}

export function IconBolt({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M13 3L4 14H11L10 21L19 10H12Z" />
    </svg>
  );
}

export function IconDots({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSearch({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <circle cx="11" cy="11" r="6" />
      <line x1="15.5" y1="15.5" x2="20" y2="20" />
    </svg>
  );
}

export function IconDownload({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 3V15M12 15L7 10M12 15L17 10" />
      <path d="M4 17V20H20V17" />
    </svg>
  );
}

export function IconFilter({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M4 5H20L14 13V20L10 18V13Z" />
    </svg>
  );
}

export function IconCheck({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M5 12L10 17L20 7" />
    </svg>
  );
}

export function IconX({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M6 6L18 18M18 6L6 18" />
    </svg>
  );
}
