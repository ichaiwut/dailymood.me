"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("menu")}
        className="flex items-center gap-2 rounded-full p-1 pr-2.5 transition hover:bg-black/5"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span
            className="h-8 w-8 rounded-full"
            style={{ background: "var(--hairline)" }}
          />
        )}
        <BurgerIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lift)",
            border: "1px solid var(--hairline)",
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid var(--hairline)" }}
          >
            {user.image && (
              <img
                src={user.image}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-sm font-semibold"
                style={{ color: "var(--ink)" }}
              >
                {user.name}
              </div>
              {user.email && (
                <div
                  className="truncate text-xs"
                  style={{ color: "var(--ink-3)" }}
                >
                  {user.email}
                </div>
              )}
            </div>
          </div>

          <div className="py-1.5">
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
              style={{ color: "var(--ink)" }}
            >
              {t("settings")}
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm transition hover:bg-black/5"
              style={{ color: "var(--ink-2)" }}
            >
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BurgerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      style={{ color: "var(--ink-2)" }}
    >
      <path
        d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
