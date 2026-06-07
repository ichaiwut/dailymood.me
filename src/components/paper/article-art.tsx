/**
 * ArticleArt — hand-drawn inline-SVG cover illustrations, one composition per
 * tone (sunrise/journal, clouds+rain, breath rings, speech bubbles, moon+stars,
 * open book). 400×240 viewBox, scales to its container. No external images.
 *
 * Used as the cover fallback on the paper grid when an article has no uploaded
 * cover photo. Ported from the design handoff (states-articles.jsx).
 */

import { asTone, type Tone } from "./tone";

interface Palette {
  bg: string;
  tint: string;
  dark: string;
  accent: string;
}

const PALETTE: Record<Tone, Palette> = {
  peach: { bg: "var(--peach)", tint: "#FFE7D2", dark: "#B25F1D", accent: "var(--purple)" },
  lavender: { bg: "var(--lavender)", tint: "#EFE3F5", dark: "#6B4A8E", accent: "var(--peach)" },
  mint: { bg: "var(--mint)", tint: "#D8F7EC", dark: "#1F8B6A", accent: "var(--yellow)" },
  yellow: { bg: "var(--yellow)", tint: "#FFE9B0", dark: "#8C6816", accent: "var(--purple)" },
  blue: { bg: "#9ACDE2", tint: "#D9EBF3", dark: "#3E6D85", accent: "var(--peach)" },
  purple: { bg: "var(--purple)", tint: "#E9DAFD", dark: "#5A2BB3", accent: "var(--yellow)" },
};

const svgProps = {
  viewBox: "0 0 400 240",
  width: "100%",
  preserveAspectRatio: "xMidYMid slice",
  style: { display: "block", width: "100%", height: "100%" } as const,
};

export function ArticleArt({ tone }: { tone: string | null | undefined }) {
  const t = asTone(tone);
  const p = PALETTE[t];

  if (t === "peach") {
    // sunrise + mountain + journal
    return (
      <svg {...svgProps} aria-hidden>
        <rect width="400" height="240" fill={p.tint} />
        <circle cx="290" cy="120" r="64" fill={p.bg} />
        <path d="M0 240 L0 175 Q 100 100 220 165 Q 320 215 400 145 L400 240 Z" fill={p.dark} opacity=".22" />
        <path d="M0 240 L0 200 Q 130 155 260 195 Q 340 220 400 195 L400 240 Z" fill={p.dark} opacity=".4" />
        <g transform="translate(58 70) rotate(-8)">
          <rect width="80" height="100" rx="6" fill="#fff" stroke={p.dark} strokeWidth="2" />
          <line x1="14" y1="26" x2="66" y2="26" stroke={p.dark} strokeWidth="2" strokeLinecap="round" opacity=".6" />
          <line x1="14" y1="40" x2="56" y2="40" stroke={p.dark} strokeWidth="2" strokeLinecap="round" opacity=".5" />
          <line x1="14" y1="54" x2="60" y2="54" stroke={p.dark} strokeWidth="2" strokeLinecap="round" opacity=".4" />
          <circle cx="62" cy="76" r="10" fill={p.bg} />
          <path d="M55 74 Q 62 80 69 74" stroke={p.dark} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
        <g fill={p.accent}>
          <circle cx="350" cy="50" r="4" />
          <circle cx="370" cy="90" r="2.5" />
          <circle cx="180" cy="40" r="3" />
        </g>
      </svg>
    );
  }

  if (t === "lavender") {
    // clouds + raindrops (mental fatigue)
    return (
      <svg {...svgProps} aria-hidden>
        <rect width="400" height="240" fill={p.tint} />
        <g fill={p.bg}>
          <ellipse cx="120" cy="90" rx="60" ry="28" />
          <ellipse cx="160" cy="80" rx="46" ry="24" />
          <ellipse cx="280" cy="100" rx="70" ry="30" />
        </g>
        <g fill={p.dark} opacity=".7">
          {[110, 140, 170, 200, 240, 270, 300, 330].map((x, i) => (
            <path
              key={i}
              d={`M ${x} ${135 + (i % 3) * 8} Q ${x - 4} ${145 + (i % 3) * 8} ${x} ${158 + (i % 3) * 8} Q ${x + 4} ${145 + (i % 3) * 8} ${x} ${135 + (i % 3) * 8} Z`}
            />
          ))}
        </g>
        <g transform="translate(170 165)">
          <circle r="34" fill="#fff" />
          <circle cx="-10" cy="-6" r="2.6" fill={p.dark} />
          <circle cx="10" cy="-6" r="2.6" fill={p.dark} />
          <path d="M -10 12 Q 0 8 10 12" stroke={p.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  if (t === "mint") {
    // breath rings
    return (
      <svg {...svgProps} aria-hidden>
        <rect width="400" height="240" fill={p.tint} />
        <g fill="none" stroke={p.bg} strokeWidth="3">
          <circle cx="200" cy="120" r="100" opacity=".5" />
          <circle cx="200" cy="120" r="78" opacity=".7" />
          <circle cx="200" cy="120" r="56" opacity=".9" />
        </g>
        <circle cx="200" cy="120" r="36" fill={p.bg} />
        <text x="200" y="115" textAnchor="middle" fontSize="11" fontWeight="800" fill={p.dark} letterSpacing=".1em">BREATHE</text>
        <text x="200" y="132" textAnchor="middle" fontSize="14" fontWeight="800" fill={p.dark}>4 · 7 · 8</text>
        <g fill={p.dark} opacity=".5">
          <path d="M 70 50 Q 50 70 70 90 Q 90 70 70 50 Z" />
          <path d="M 340 180 Q 320 200 340 220 Q 360 200 340 180 Z" />
        </g>
      </svg>
    );
  }

  if (t === "yellow") {
    // speech bubbles — self-talk
    return (
      <svg {...svgProps} aria-hidden>
        <rect width="400" height="240" fill={p.tint} />
        <path d="M 60 60 Q 60 40 80 40 L 240 40 Q 260 40 260 60 L 260 130 Q 260 150 240 150 L 130 150 L 100 175 L 110 150 L 80 150 Q 60 150 60 130 Z" fill="#fff" stroke={p.dark} strokeWidth="2.5" />
        <line x1="80" y1="70" x2="220" y2="70" stroke={p.dark} strokeWidth="2.4" strokeLinecap="round" />
        <line x1="80" y1="90" x2="200" y2="90" stroke={p.dark} strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
        <line x1="80" y1="110" x2="170" y2="110" stroke={p.dark} strokeWidth="2.4" strokeLinecap="round" opacity=".5" />
        <path d="M 250 130 Q 250 120 260 120 L 340 120 Q 350 120 350 130 L 350 170 Q 350 180 340 180 L 290 180 L 270 200 L 280 180 L 260 180 Q 250 180 250 170 Z" fill={p.bg} stroke={p.dark} strokeWidth="2.5" />
        <text x="300" y="156" textAnchor="middle" fontSize="20" fontWeight="800" fill={p.dark}>💛</text>
      </svg>
    );
  }

  if (t === "blue") {
    // moon + stars (rest signals)
    return (
      <svg {...svgProps} aria-hidden>
        <rect width="400" height="240" fill={p.tint} />
        <circle cx="280" cy="100" r="58" fill={p.bg} />
        <circle cx="260" cy="92" r="50" fill={p.tint} />
        <g fill={p.dark} opacity=".7">
          {[[80, 60], [140, 40], [200, 80], [100, 140], [60, 180], [330, 180], [190, 180]].map(([x, y], i) => (
            <path key={i} d={`M ${x} ${y - 6} L ${x + 1.5} ${y - 1.5} L ${x + 6} ${y} L ${x + 1.5} ${y + 1.5} L ${x} ${y + 6} L ${x - 1.5} ${y + 1.5} L ${x - 6} ${y} L ${x - 1.5} ${y - 1.5} Z`} />
          ))}
        </g>
        <g transform="translate(140 145)">
          <circle r="32" fill="#fff" />
          <path d="M -12 -4 Q -8 -8 -4 -4" stroke={p.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M 4 -4 Q 8 -8 12 -4" stroke={p.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M -8 10 Q 0 8 8 10" stroke={p.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // purple — open book & heart
  return (
    <svg {...svgProps} aria-hidden>
      <rect width="400" height="240" fill={p.tint} />
      <g transform="translate(60 60)">
        <path d="M 0 20 L 140 0 L 140 100 L 0 120 Z" fill="#fff" stroke={p.dark} strokeWidth="2.5" />
        <path d="M 140 0 L 280 20 L 280 120 L 140 100 Z" fill="#fff" stroke={p.dark} strokeWidth="2.5" />
        <line x1="140" y1="0" x2="140" y2="100" stroke={p.dark} strokeWidth="2" />
        {[18, 36, 54, 72].map((y, i) => (
          <line key={i} x1={20 + i * 2} y1={y + 6} x2={120 - i * 2} y2={y - 6} stroke={p.dark} strokeWidth="1.6" opacity=".4" />
        ))}
        {[18, 36, 54, 72].map((y, i) => (
          <line key={i} x1={160 + i * 2} y1={y - 6} x2={260 - i * 2} y2={y + 6} stroke={p.dark} strokeWidth="1.6" opacity=".4" />
        ))}
      </g>
      <g transform="translate(310 50)" fill={p.bg}>
        <path d="M 20 30 Q 5 18 10 6 Q 20 -4 25 8 Q 30 -4 40 6 Q 45 18 30 30 L 25 35 Z" />
      </g>
    </svg>
  );
}
