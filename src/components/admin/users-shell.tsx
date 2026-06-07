"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { togglePremium, deleteUser } from "@/lib/admin-actions";
import { AdminPageHeader } from "./admin-page-header";
import { A } from "./admin-ui";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isPremium: boolean;
  plan: "free" | "premium" | "trial";
  planInterval: string | null;
  createdAt: string;
  entryCount: number;
  lastEntryDate: string | null;
}

const COLS = "1.4fr 1.6fr 1fr 1fr 1fr .8fr";

function userStatus(lastEntryDate: string | null): "active" | "paused" | "inactive" {
  if (!lastEntryDate) return "inactive";
  const days = Math.floor(
    (Date.now() - new Date(lastEntryDate).getTime()) / 86400_000,
  );
  if (days <= 7) return "active";
  if (days <= 30) return "paused";
  return "inactive";
}

const STATUS_DOT: Record<string, string> = {
  active: "#39B58A",
  paused: "#E5B05A",
  inactive: "#C4B8A8",
};

export function UsersShell({
  users,
  total,
  active30d,
  page,
  pageSize,
  q,
  filter,
}: {
  users: UserRow[];
  total: number;
  active30d: number;
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
      <AdminPageHeader
        title="ผู้ใช้ทั้งหมด"
        subtitle={`${total.toLocaleString()} users · ${active30d.toLocaleString()} active 30 วันล่าสุด`}
      />

      {/* Filter bar */}
      <div style={A.filterBar}>
        <input
          type="text"
          placeholder="ค้นหาอีเมล / ชื่อ..."
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              nav({ q: (e.target as HTMLInputElement).value, page: "0" });
          }}
          style={{ ...A.input, flex: 1, maxWidth: 360 }}
        />
        <select
          value={filter}
          onChange={(e) => nav({ filter: e.target.value, page: "0" })}
          style={{ ...A.input, width: 140 }}
        >
          <option value="all">ทั้งหมด</option>
          <option value="premium">Premium</option>
          <option value="free">Free</option>
        </select>
        <button
          style={{ ...A.btnInk, opacity: 0.5, cursor: "default" }}
          disabled
          title="Coming soon"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Users table */}
      <div
        style={{
          ...A.cardFlush,
          opacity: pending ? 0.6 : 1,
          transition: "opacity 200ms",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            gap: 12,
            padding: "12px 18px",
            background: "var(--surface-2)",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <div>ชื่อ</div>
          <div>อีเมล</div>
          <div>แผน</div>
          <div>กิจกรรม</div>
          <div>Streak</div>
          <div>สถานะ</div>
        </div>

        {/* Empty state */}
        {users.length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 14,
            }}
          >
            ยังไม่มีผู้ใช้ที่ตรงเงื่อนไข — ลองเปลี่ยน filter ดู
          </div>
        )}

        {/* Rows */}
        {users.map((u, i) => {
          const status = userStatus(u.lastEntryDate);
          return (
            <Link
              key={u.id}
              href={`/admin/users/${u.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                gap: 12,
                padding: "14px 18px",
                borderTop: "1px solid var(--hairline)",
                fontSize: 14,
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Name + avatar */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                {u.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={u.image}
                    alt=""
                    width={28}
                    height={28}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 50,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 50,
                      background: `hsl(${i * 47}, 60%, 70%)`,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 11,
                    }}
                  >
                    {(u.name || u.email).slice(0, 2).toUpperCase()}
                  </div>
                )}
                <b>{u.name || "—"}</b>
              </div>

              {/* Email */}
              <div style={{ color: "var(--ink-3)" }}>{u.email}</div>

              {/* Plan pill */}
              <div>
                {u.plan === "premium" ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, var(--peach), var(--purple))",
                      color: "#fff",
                    }}
                  >
                    ✨ Premium
                  </span>
                ) : u.plan === "trial" ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 800,
                      background: "var(--w-tint-warning)",
                      color: "var(--w-tint-warning-fg)",
                    }}
                  >
                    Trial
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 800,
                      background: "var(--w-tint)",
                      color: "var(--w-ink-2)",
                    }}
                  >
                    Free
                  </span>
                )}
              </div>

              {/* Activity (entries) */}
              <div>{u.entryCount} entries</div>

              {/* Streak (approximate from entries) */}
              <div>
                {u.entryCount > 0
                  ? `streak ${Math.min(u.entryCount, 99)}`
                  : "-"}
              </div>

              {/* Status dot */}
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 50,
                      background: STATUS_DOT[status],
                    }}
                  />
                  {status}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 18px",
              borderTop: "1px solid var(--hairline)",
              fontSize: 12,
              color: "var(--ink-3)",
            }}
          >
            <div>
              แสดง {users.length} จาก {total.toLocaleString()}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => nav({ page: String(page - 1) })}
                disabled={page === 0}
                style={{
                  ...A.btnSmall,
                  background: "var(--surface)",
                  opacity: page === 0 ? 0.4 : 1,
                }}
              >
                ←
              </button>
              {Array.from(
                { length: Math.min(5, totalPages) },
                (_, k) => {
                  const p =
                    Math.max(
                      0,
                      Math.min(page - 2, totalPages - 5),
                    ) + k;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => nav({ page: String(p) })}
                      style={{
                        ...A.btnSmall,
                        background:
                          p === page
                            ? "var(--ink)"
                            : "var(--surface)",
                        color:
                          p === page ? "#fff" : "var(--ink-2)",
                      }}
                    >
                      {p + 1}
                    </button>
                  );
                },
              )}
              <button
                onClick={() => nav({ page: String(page + 1) })}
                disabled={page + 1 >= totalPages}
                style={{
                  ...A.btnSmall,
                  background: "var(--surface)",
                  opacity: page + 1 >= totalPages ? 0.4 : 1,
                }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
