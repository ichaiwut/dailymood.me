"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function TopBarClient({
  name,
  email,
}: {
  name: string | null;
  image: string | null;
  email: string | null;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const firstName = name?.split(" ")[0] ?? name;
  const initials = getInitials(name);

  const [dayLabel, setDayLabel] = useState("");
  const [greeting, setGreeting] = useState<"greetMorning" | "greetAfternoon" | "greetEvening">("greetAfternoon");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div ref={menuRef} className="relative flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={tc("menu")}
          className="shrink-0 grid place-items-center transition active:scale-95"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#A673F1",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            border: "none",
          }}
        >
          {initials}
        </button>
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
              fontSize: 17,
              fontWeight: 800,
              color: "var(--ink)",
              lineHeight: 1.2,
            }}
            suppressHydrationWarning
          >
            {t(greeting)}, {firstName}
          </p>
        </div>

        {menuOpen && (
          <div
            role="menu"
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden"
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              boxShadow: "0 14px 40px rgba(0,0,0,0.12), 0 0 0 1px var(--hairline)",
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
              <div
                className="truncate text-sm font-semibold"
                style={{ color: "var(--ink)" }}
              >
                {name}
              </div>
              {email && (
                <div
                  className="truncate text-xs"
                  style={{ color: "var(--ink-3)" }}
                >
                  {email}
                </div>
              )}
            </div>

            <div className="py-1.5">
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
                style={{ color: "var(--ink)" }}
              >
                {tc("settings")}
              </Link>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="block w-full px-4 py-2.5 text-left text-sm transition hover:bg-black/5"
                style={{ color: "var(--ink-2)" }}
              >
                {tc("logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
