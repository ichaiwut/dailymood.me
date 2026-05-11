"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";

const LOGO_URL = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/assets/logo.png`;

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function TopBarClient({
  name,
  image,
  email,
}: {
  name: string | null;
  image: string | null;
  email: string | null;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const firstName = name?.split(" ")[0] ?? name;
  const initials = getInitials(name);
  const isHome = pathname === "/" || pathname === "";

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

  if (isHome) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {image ? (
            <img
              src={image}
              alt={name ?? ""}
              width={44}
              height={44}
              className="shrink-0"
              style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
              referrerPolicy="no-referrer"
            />
          ) : (
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
          )}
          <div className="min-w-0">
            <p className="text-xs truncate" style={{ color: "var(--ink-3)", minHeight: 16 }} suppressHydrationWarning>
              {dayLabel}
            </p>
            <p className="truncate" style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }} suppressHydrationWarning>
              {t(greeting)}, {firstName}
            </p>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={tc("menu")}
            className="grid place-items-center transition active:scale-95"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--surface, #fff)",
              border: "1.5px solid var(--hairline, #F2F0F5)",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" stroke="var(--ink, #0A0A0A)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <UserMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} name={name} email={email} tc={tc} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={"/" as "/"}>
        <img
          src={LOGO_URL}
          alt="Dailymood"
          height={32}
          style={{ height: 32, width: "auto" }}
        />
      </Link>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={tc("menu")}
          className="grid place-items-center transition active:scale-95"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--surface, #fff)",
            border: "1.5px solid var(--hairline, #F2F0F5)",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" stroke="var(--ink, #0A0A0A)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <UserMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} name={name} email={email} tc={tc} />
      </div>
    </div>
  );
}

function UserMenu({
  menuOpen,
  setMenuOpen,
  name,
  email,
  tc,
}: {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  name: string | null;
  email: string | null;
  tc: (key: string) => string;
}) {
  if (!menuOpen) return null;

  return (
    <div
      role="menu"
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden"
      style={{
        background: "var(--surface)",
        borderRadius: 18,
        boxShadow: "0 14px 40px rgba(0,0,0,0.12), 0 0 0 1px var(--hairline)",
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <div className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>{name}</div>
        {email && <div className="truncate text-xs" style={{ color: "var(--ink-3)" }}>{email}</div>}
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
        <Link
          href={"/privacy" as "/"}
          role="menuitem"
          onClick={() => setMenuOpen(false)}
          className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
          style={{ color: "var(--ink)" }}
        >
          {tc("privacy")}
        </Link>
        <Link
          href={"/terms" as "/"}
          role="menuitem"
          onClick={() => setMenuOpen(false)}
          className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
          style={{ color: "var(--ink)" }}
        >
          {tc("terms")}
        </Link>
        <div style={{ height: 1, background: "var(--hairline)", margin: "4px 16px" }} />
        <button
          role="menuitem"
          onClick={() => { setMenuOpen(false); signOut(); }}
          className="block w-full px-4 py-2.5 text-left text-sm transition hover:bg-black/5"
          style={{ color: "var(--ink-2)" }}
        >
          {tc("logout")}
        </button>
      </div>
    </div>
  );
}
