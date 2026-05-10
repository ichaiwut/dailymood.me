"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { togglePremium, deleteUser } from "@/lib/admin-actions";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  isPremium: boolean;
  planInterval: string | null;
  createdAt: string;
  entryCount: number;
}

const FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "premium", label: "Premium" },
  { value: "free", label: "Free" },
];

export function UsersShell({
  users,
  total,
  page,
  pageSize,
  q,
  filter,
}: {
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  filter: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / pageSize);

  function nav(params: Record<string, string>) {
    const sp = new URLSearchParams({ q, filter, page: String(page), ...params });
    router.push(`/admin/users?${sp}`);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
        ผู้ใช้ ({total})
      </h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="ค้นหาชื่อหรืออีเมล..."
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              nav({ q: (e.target as HTMLInputElement).value, page: "0" });
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1.5px solid var(--hairline)",
            fontSize: 14,
            width: 260,
            background: "var(--surface)",
          }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => nav({ filter: f.value, page: "0" })}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--hairline)",
                background: filter === f.value ? "var(--purple)" : "var(--surface)",
                color: filter === f.value ? "#fff" : "var(--ink-2)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--hairline)",
          borderRadius: 16,
          overflow: "hidden",
          opacity: pending ? 0.6 : 1,
          transition: "opacity 200ms",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["อีเมล", "ชื่อ", "สถานะ", "บันทึก", "สมัครเมื่อ", "จัดการ"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      padding: "10px 14px",
                      textAlign: "left",
                      borderBottom: "1.5px solid var(--hairline)",
                      background: "var(--surface-2)",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "var(--ink-3)",
                    fontSize: 14,
                  }}
                >
                  ไม่พบผู้ใช้
                </td>
              </tr>
            )}
            {users.map((u, i) => (
              <tr
                key={u.id}
                style={{
                  background:
                    i % 2 === 1 ? "var(--surface-2)" : "var(--surface)",
                }}
              >
                <td style={{ padding: "10px 14px", fontSize: 13 }}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    style={{ color: "var(--purple)", textDecoration: "none", fontWeight: 600 }}
                  >
                    {u.email}
                  </Link>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ink-2)" }}>
                  {u.name || "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button
                    onClick={() =>
                      startTransition(() => togglePremium(u.id, !u.isPremium))
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 12px",
                      borderRadius: 99,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: u.isPremium ? "#F0EDFA" : "#F5F5F5",
                      color: u.isPremium ? "var(--purple)" : "var(--ink-3)",
                    }}
                  >
                    {u.isPremium ? "✨ Pro" : "Free"}
                    {u.planInterval && (
                      <span style={{ fontWeight: 500, opacity: 0.7 }}>
                        ({u.planInterval})
                      </span>
                    )}
                  </button>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ink-2)" }}>
                  {u.entryCount}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-3)" }}>
                  {new Date(u.createdAt).toLocaleDateString("th-TH")}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button
                    onClick={() => {
                      if (confirm(`ลบผู้ใช้ ${u.email}? ข้อมูลทั้งหมดจะถูกลบ`))
                        startTransition(() => deleteUser(u.id));
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #FCC",
                      background: "#FFF5F5",
                      color: "#D44",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              fontSize: 13,
              color: "var(--ink-2)",
              borderTop: "1px solid var(--hairline)",
            }}
          >
            <span>
              หน้า {page + 1} / {totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => nav({ page: String(page - 1) })}
                disabled={page === 0}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--hairline)",
                  background: "var(--surface)",
                  opacity: page === 0 ? 0.4 : 1,
                }}
              >
                ก่อนหน้า
              </button>
              <button
                onClick={() => nav({ page: String(page + 1) })}
                disabled={page + 1 >= totalPages}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--hairline)",
                  background: "var(--surface)",
                  opacity: page + 1 >= totalPages ? 0.4 : 1,
                }}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
