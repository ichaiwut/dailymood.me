"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { SmartLogModal } from "./smart-log-modal";
import { BrandMark } from "./brand-mark";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { useTheme } from "./theme-provider";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const NAV_ITEMS = [
  { href: "/", label: "navHome", match: (p: string) => p === "/" || p === "" },
  { href: "/calendar", label: "navCalendar", match: (p: string) => p.startsWith("/calendar") },
  { href: "/stats", label: "navStats", match: (p: string) => p.startsWith("/stats") },
  { href: "/insights", label: "navInsights", match: (p: string) => p.startsWith("/insights") || p.startsWith("/ask-ai") },
  { href: "/articles", label: "navArticles", match: (p: string) => p.startsWith("/articles") },
] as const;

export function TopBarClient({
  name,
  image,
  email,
  tier = "free",
  moodPack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
}: {
  name: string | null;
  image: string | null;
  email: string | null;
  tier?: "free" | "premium";
  moodPack?: string;
  iconFormat?: string;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const initials = getInitials(name);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showSmart, setShowSmart] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (desktopMenuRef.current?.contains(t) || mobileMenuRef.current?.contains(t)) return;
      setMenuOpen(false);
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
    <>
      {/* Desktop topbar */}
      <header className="w-topbar">
        <div className="w-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <Link href={"/" as "/"} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "var(--ink)" }}>
              <DMLogo />
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>DailyMood</span>
            </Link>
            <nav style={{ display: "flex", gap: 4 }}>
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href as "/"}
                  className={`w-nav-link ${item.match(pathname) ? "active" : ""}`}
                >
                  {t(item.label)}
                </Link>
              ))}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className="w-btn w-btn-primary"
              style={{ height: 36 }}
              onClick={() => setShowSmart(true)}
            >
              + {t("navLog") || "บันทึก"}
            </button>
            <ThemeToggle isDark={isDark} onToggle={() => setTheme(isDark ? "light" : "dark")} />
            <LanguageToggle locale={locale} />
            <div ref={desktopMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: image ? "transparent" : "linear-gradient(135deg, var(--peach), var(--purple))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {image ? (
                  <img src={image} alt="" width={32} height={32} style={{ width: 32, height: 32, objectFit: "cover" }} referrerPolicy="no-referrer" />
                ) : (
                  initials
                )}
              </button>
              <UserMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} name={name} email={email} tc={tc} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile topbar */}
      <MobileTopbar
        name={name}
        image={image}
        initials={initials}
        pathname={pathname}
        locale={locale}
        t={t}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menuRef={mobileMenuRef}
        tc={tc}
        email={email}
      />

      {showSmart && (
        <SmartLogModal
          tier={tier}
          pack={moodPack}
          iconFormat={iconFormat}
          onClose={() => setShowSmart(false)}
          onSaved={() => {
            setShowSmart(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

function MobileTopbar({
  name,
  image,
  initials,
  pathname,
  locale,
  t,
  menuOpen,
  setMenuOpen,
  menuRef,
  tc,
  email,
}: {
  name: string | null;
  image: string | null;
  initials: string;
  pathname: string;
  locale: string;
  t: (key: string) => string;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  tc: (key: string) => string;
  email: string | null;
}) {
  const isHome = pathname === "/" || pathname === "";
  const firstName = name?.split(" ")[0] ?? name;
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
    <header className="mobile-topbar md:hidden relative z-30 px-4 pt-4 pb-3">
      <div className="mx-auto w-full max-w-[768px]">
        {isHome ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {image ? (
                <img src={image} alt="" width={40} height={40} className="shrink-0 rounded-full object-cover" style={{ width: 40, height: 40 }} referrerPolicy="no-referrer" />
              ) : (
                <div className="shrink-0 grid place-items-center rounded-full" style={{ width: 40, height: 40, background: "linear-gradient(135deg, var(--peach), var(--purple))", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs truncate" style={{ color: "var(--ink-3)" }} suppressHydrationWarning>{dayLabel}</p>
                <p className="truncate" style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }} suppressHydrationWarning>
                  {t(greeting)}, {firstName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDark} onToggle={() => setTheme(isDark ? "light" : "dark")} />
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="grid place-items-center"
                  style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--hairline)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
                <UserMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} name={name} email={email} tc={tc} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Link href={"/" as "/"} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "var(--ink)" }}>
              <DMLogo />
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>DailyMood</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDark} onToggle={() => setTheme(isDark ? "light" : "dark")} />
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: image ? "transparent" : "linear-gradient(135deg, var(--peach), var(--purple))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  border: "none",
                  overflow: "hidden",
                }}
              >
                {image ? (
                  <img src={image} alt="" width={32} height={32} style={{ width: 32, height: 32, objectFit: "cover" }} referrerPolicy="no-referrer" />
                ) : (
                  initials
                )}
              </button>
              <UserMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} name={name} email={email} tc={tc} />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" stroke="var(--ink)" strokeWidth="2" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function DMLogo({ size = 28 }: { size?: number }) {
  return <BrandMark size={size} />;
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
      className="absolute right-0 w-60"
      style={{
        top: "calc(100% + 8px)",
        background: "var(--surface)",
        borderRadius: 18,
        boxShadow: "0 14px 40px rgba(0,0,0,0.12), 0 0 0 1px var(--hairline)",
        zIndex: 9999,
        overflow: "visible",
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <div className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>{name}</div>
        {email && <div className="truncate text-xs" style={{ color: "var(--ink-3)" }}>{email}</div>}
      </div>
      <div className="py-1.5">
        <Link href={"/articles" as "/"} role="menuitem" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm transition hover:bg-black/5" style={{ color: "var(--ink)" }}>
          {tc("articles")}
        </Link>
        <Link href="/settings" role="menuitem" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm transition hover:bg-black/5" style={{ color: "var(--ink)" }}>
          {tc("settings")}
        </Link>
        <Link href={"/privacy" as "/"} role="menuitem" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm transition hover:bg-black/5" style={{ color: "var(--ink)" }}>
          {tc("privacy")}
        </Link>
        <Link href={"/terms" as "/"} role="menuitem" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm transition hover:bg-black/5" style={{ color: "var(--ink)" }}>
          {tc("terms")}
        </Link>
        <div style={{ height: 1, background: "var(--hairline)", margin: "4px 16px" }} />
        <button role="menuitem" onClick={() => { setMenuOpen(false); signOut(); }} className="block w-full px-4 py-2.5 text-left text-sm transition hover:bg-black/5" style={{ color: "var(--ink-2)" }}>
          {tc("logout")}
        </button>
      </div>
    </div>
  );
}

function LanguageToggle({ locale }: { locale: string }) {
  const next = locale === "th" ? "en" : "th";
  const label = locale === "th" ? "EN" : "TH";

  function switchLocale() {
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    // Persist to the profile too, but never let a failed PATCH block the switch —
    // the cookie above is what drives the locale, so always reload.
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    })
      .catch(() => {})
      .finally(() => globalThis.location.assign("/"));
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        borderRadius: 100,
        border: "1px solid var(--hairline)",
        background: "var(--surface)",
        fontFamily: "inherit",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        color: "var(--ink-2)",
      }}
    >
      🌐 {label}
    </button>
  );
}
