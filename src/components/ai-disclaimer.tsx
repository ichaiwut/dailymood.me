"use client";

import { useTranslations } from "next-intl";

type Variant = "chat" | "analysis" | "ask" | "story" | "parse" | "article";

export function AiDisclaimer({ variant, className, style }: { variant: Variant; className?: string; style?: React.CSSProperties }) {
  const t = useTranslations("aiDisclaimer");
  return (
    <p
      className={className}
      style={{
        fontSize: 14,
        color: "var(--ink-3)",
        lineHeight: 1.4,
        margin: 0,
        ...style,
      }}
    >
      {t(variant)}
    </p>
  );
}
