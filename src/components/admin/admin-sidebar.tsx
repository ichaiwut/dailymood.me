"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "ภาพรวม", icon: "📊" },
  { href: "/admin/users", label: "ผู้ใช้", icon: "👥" },
  { href: "/admin/entries", label: "บันทึก", icon: "📝" },
  { href: "/admin/packs", label: "Mood Packs", icon: "🎨" },
  { href: "/admin/ai", label: "การใช้ AI", icon: "🤖" },
  { href: "/admin/feedback", label: "ความคิดเห็น", icon: "💬" },
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
        background: "var(--surface)",
        borderRight: "1.5px solid var(--hairline)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ padding: "0 20px", marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--purple)" }}>
          DailyMood
        </div>
        <div
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            background: "var(--purple)",
            color: "#fff",
            borderRadius: 4,
            padding: "2px 8px",
            marginTop: 4,
          }}
        >
          Admin
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--purple)" : "var(--ink-2)",
                background: active ? "var(--surface-2)" : "transparent",
                borderRight: active ? "3px solid var(--purple)" : "3px solid transparent",
                textDecoration: "none",
                transition: "all 160ms",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "0 20px",
          fontSize: 12,
          color: "var(--ink-3)",
          borderTop: "1px solid var(--hairline)",
          paddingTop: 16,
        }}
      >
        {email}
      </div>
    </aside>
  );
}
