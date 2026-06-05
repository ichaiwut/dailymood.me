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
          className={`pa-filter${active === tab.key ? " active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
