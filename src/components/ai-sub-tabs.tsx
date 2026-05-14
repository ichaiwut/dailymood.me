"use client";

import { Link } from "@/i18n/navigation";

interface Props {
  active: "insights" | "ask-ai";
  locale: string;
}

export function AiSubTabs({ active, locale }: Props) {
  const tabs = [
    { key: "insights" as const, href: "/insights" as "/", label: locale === "th" ? "✨ Insights" : "✨ Insights" },
    { key: "ask-ai" as const, href: "/ask-ai" as "/", label: locale === "th" ? "💬 Ask AI" : "💬 Ask AI" },
  ];

  return (
    <div className="flex items-center gap-2" style={{ paddingTop: 8, paddingBottom: 12 }}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          style={{
            padding: "8px 18px", borderRadius: 20,
            background: active === tab.key ? "var(--ink)" : "transparent",
            color: active === tab.key ? "#fff" : "var(--ink-2)",
            border: active === tab.key ? "none" : "1.5px solid #F2F0F5",
            fontSize: 14, fontWeight: 700, textDecoration: "none",
            transition: "all 0.15s",
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
