"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteEntry } from "@/lib/admin-actions";

interface EntryRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  moodEmoji: string;
  moodLabel: string;
  aiSource: string;
  hasImage: boolean;
  date: string;
  createdAt: string;
}

export function EntriesShell({
  entries,
  total,
  page,
  pageSize,
  userId,
}: {
  entries: EntryRow[];
  total: number;
  page: number;
  pageSize: number;
  userId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / pageSize);

  function nav(params: Record<string, string>) {
    const sp = new URLSearchParams({ page: String(page), ...params });
    if (userId) sp.set("userId", userId);
    router.push(`/admin/entries?${sp}`);
  }

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: "opacity 200ms" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          บันทึก ({total})
          {userId && (
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)", marginLeft: 8 }}>
              กรอง: {userId.slice(0, 8)}...
              <button
                onClick={() => router.push("/admin/entries")}
                style={{
                  marginLeft: 6,
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: "1px solid var(--hairline)",
                  background: "var(--surface)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </span>
          )}
        </h1>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--hairline)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["วันที่", "ผู้ใช้", "Mood", "AI", "รูป", "จัดการ"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      padding: "10px 12px",
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
            {entries.length === 0 && (
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
                  ไม่มีบันทึก
                </td>
              </tr>
            )}
            {entries.map((e, i) => (
              <tr
                key={e.id}
                style={{
                  background: i % 2 === 1 ? "var(--surface-2)" : "var(--surface)",
                }}
              >
                <td style={{ padding: "8px 12px", fontSize: 13 }}>{e.date}</td>
                <td style={{ padding: "8px 12px", fontSize: 13 }}>
                  <Link
                    href={`/admin/users/${e.userId}`}
                    style={{ color: "var(--purple)", textDecoration: "none", fontSize: 12 }}
                  >
                    {e.userEmail}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", fontSize: 16 }}>
                  {e.moodEmoji} <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{e.moodLabel}</span>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background:
                        e.aiSource === "manual" ? "#F5F5F5" : "#F0EDFA",
                      color:
                        e.aiSource === "manual" ? "var(--ink-3)" : "var(--purple)",
                    }}
                  >
                    {e.aiSource}
                  </span>
                </td>
                <td style={{ padding: "8px 12px", fontSize: 14, textAlign: "center" }}>
                  {e.hasImage ? "📷" : "—"}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <button
                    onClick={() => {
                      if (confirm("ลบบันทึกนี้?"))
                        startTransition(() => deleteEntry(e.id));
                    }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: "1px solid #FCC",
                      background: "#FFF5F5",
                      color: "#D44",
                      fontSize: 11,
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
