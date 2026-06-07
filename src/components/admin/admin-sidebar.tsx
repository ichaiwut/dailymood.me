"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconHome, IconUsers, IconEdit, IconDoc, IconHeart, IconSparkle, IconAi } from "./admin-icons";

const NAV: {
  href: string;
  label: string;
  Icon: typeof IconHome;
  /** prefix used for active-state matching (defaults to href) */
  activePrefix?: string;
  /** render a section divider above this item */
  dividerBefore?: boolean;
}[] = [
  { href: "/admin", label: "ภาพรวม", Icon: IconHome },
  { href: "/admin/users", label: "ผู้ใช้", Icon: IconUsers },
  { href: "/admin/entries", label: "บันทึก", Icon: IconEdit },
  // matches /admin/articles and /admin/article-categories
  { href: "/admin/articles", label: "บทความ", Icon: IconDoc, activePrefix: "/admin/article" },
  { href: "/admin/feedback", label: "Feedback", Icon: IconHeart },
  { href: "/admin/packs", label: "Mood Packs", Icon: IconSparkle, dividerBefore: true },
  { href: "/admin/ai", label: "AI Usage", Icon: IconAi },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  function isActive(item: (typeof NAV)[number]) {
    if (item.href === "/admin") return pathname === "/admin";
    return pathname.startsWith(item.activePrefix ?? item.href);
  }

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--ink)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ padding: "2px 20px 22px", display: "flex", alignItems: "center", gap: 11 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--peach), var(--purple))",
            boxShadow: "0 6px 14px -6px rgba(166,115,241,.7)",
          }}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em" }}>DailyMood</div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.18em",
              color: "var(--peach)",
            }}
          >
            ADMIN
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, paddingRight: 14 }}>
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <div key={item.href}>
              {item.dividerBefore && (
                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,.1)",
                    margin: "10px 20px 11px",
                  }}
                />
              )}
              <Link
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 18px",
                  /* folder tab — pulls out to the right when active */
                  borderRadius: "0 13px 13px 0",
                  fontSize: 13.5,
                  fontWeight: active ? 800 : 600,
                  color: active ? "#fff" : "rgba(255,255,255,.55)",
                  background: active ? "rgba(255,255,255,.10)" : "transparent",
                  borderLeft: active
                    ? "3px solid var(--peach)"
                    : "3px solid transparent",
                  textDecoration: "none",
                  transition: "color 160ms, background 160ms",
                }}
              >
                <span style={{ color: active ? "var(--peach)" : "inherit", display: "inline-flex" }}>
                  <item.Icon size={17} />
                </span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div
        style={{
          padding: "16px 20px 0",
          fontSize: 11,
          color: "rgba(255,255,255,.5)",
          borderTop: "1px solid rgba(255,255,255,.1)",
        }}
      >
        <div>v1.0.0 · prod</div>
        <div style={{ marginTop: 2 }}>{email}</div>
      </div>
    </aside>
  );
}
