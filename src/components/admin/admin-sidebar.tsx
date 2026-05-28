"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconHome, IconUsers, IconEdit, IconHeart, IconSparkle, IconAi } from "./admin-icons";

const NAV = [
  { href: "/admin", label: "ภาพรวม", Icon: IconHome },
  { href: "/admin/users", label: "ผู้ใช้", Icon: IconUsers },
  { href: "/admin/entries", label: "บันทึก", Icon: IconEdit },
  { href: "/admin/feedback", label: "Feedback", Icon: IconHeart },
  { href: "/admin/packs", label: "Mood Packs", Icon: IconSparkle },
  { href: "/admin/ai", label: "AI Usage", Icon: IconAi },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
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
      <div style={{ padding: "0 20px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--peach), var(--purple))",
          }}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>DailyMood</div>
          <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 600 }}>ADMIN</div>
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item, i) => {
          const active = isActive(item.href);
          return (
            <div key={item.href}>
              {i === 4 && (
                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,.1)",
                    margin: "8px 20px",
                  }}
                />
              )}
              <Link
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 20px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  color: active ? "#fff" : "rgba(255,255,255,.55)",
                  background: active
                    ? "rgba(255,255,255,.08)"
                    : "transparent",
                  borderLeft: active
                    ? "3px solid var(--peach)"
                    : "3px solid transparent",
                  textDecoration: "none",
                  transition: "all 160ms",
                }}
              >
                <item.Icon size={16} />
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
