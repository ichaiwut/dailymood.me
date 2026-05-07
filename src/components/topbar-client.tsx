"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function TopBarClient({
  name,
}: {
  name: string | null;
  image: string | null;
  email: string | null;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const firstName = name?.split(" ")[0] ?? name;
  const initials = getInitials(name);

  const [dayLabel, setDayLabel] = useState("");
  const [greeting, setGreeting] = useState<"greetMorning" | "greetAfternoon" | "greetEvening">("greetAfternoon");

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    setGreeting(h < 12 ? "greetMorning" : h < 18 ? "greetAfternoon" : "greetEvening");
    setDayLabel(
      now.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    );
  }, [locale]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="shrink-0 grid place-items-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#A673F1",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p
            className="text-xs truncate"
            style={{ color: "var(--ink-3)", minHeight: 16 }}
            suppressHydrationWarning
          >
            {dayLabel}
          </p>
          <p
            className="truncate"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--ink)",
              lineHeight: 1.2,
            }}
            suppressHydrationWarning
          >
            {t(greeting)}, {firstName} ✨
          </p>
        </div>
      </div>

      <div className="flex gap-2.5 shrink-0">
        <button
          aria-label="Search"
          className="icon-btn transition active:scale-95"
        >
          <SearchIcon />
        </button>
        <button
          aria-label="Notifications"
          className="icon-btn relative transition active:scale-95"
        >
          <BellIcon />
          <span
            aria-hidden
            className="absolute"
            style={{
              top: 10,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#FCA45B",
              boxShadow: "0 0 0 2px #fff",
            }}
          />
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
