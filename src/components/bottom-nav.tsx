"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SmartLogModal } from "./smart-log-modal";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";

export function BottomNav({
  tier = "free",
  pack = DEFAULT_MOOD_PACK,
}: {
  tier?: "guest" | "free" | "premium";
  pack?: string;
}) {
  const t = useTranslations("home");
  const pathname = usePathname();
  const [showSmart, setShowSmart] = useState(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname === ""
      : pathname.startsWith(href);

  return (
    <>
      <nav className="bottom-nav" aria-label="Main navigation">
        <Link href={"/" as "/"} className="nav-item" data-active={isActive("/") ? "true" : undefined}>
          <HomeIcon active={isActive("/")} />
          <span>{t("navHome")}</span>
        </Link>

        <Link href={"/calendar" as "/"} className="nav-item" data-active={isActive("/calendar") ? "true" : undefined}>
          <CalIcon active={isActive("/calendar")} />
          <span>{t("navCalendar")}</span>
        </Link>

        <button
          type="button"
          className="fab"
          aria-label="Quick log"
          onClick={() => setShowSmart(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        <Link href={"/insights" as "/"} className="nav-item" data-active={isActive("/insights") ? "true" : undefined}>
          <InsightsIcon active={isActive("/insights")} />
          <span>{t("navInsights")}</span>
        </Link>

        <Link href={"/settings" as "/"} className="nav-item" data-active={isActive("/settings") ? "true" : undefined}>
          <UserIcon active={isActive("/settings")} />
          <span>{t("navProfile")}</span>
        </Link>
      </nav>

      {showSmart && (
        <SmartLogModal
          tier={tier}
          pack={pack}
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

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 11l9-8 9 8M5 9v12h14V9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "rgba(166,115,241,0.15)" : "none"}
      />
    </svg>
  );
}

function CalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7h18M3 7v13h18V7M3 7l3-4M21 7l-3-4M8 11h2M14 11h2M8 15h2M14 15h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.7}
      />
    </svg>
  );
}

function InsightsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "rgba(166,115,241,0.15)" : "none"}
      />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "rgba(166,115,241,0.15)" : "none"}
      />
    </svg>
  );
}
