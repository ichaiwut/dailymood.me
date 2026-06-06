"use client";

import Link from "next/link";
import { AdminPageHeader } from "./admin-page-header";
import { AdminStatCard } from "./admin-stat-card";
import { AdminBarChart } from "./admin-bar-chart";
import { AdminBadge } from "./admin-badge";
import { A } from "./admin-ui";
import type {
  OverviewStats,
  DauRow,
  RecentUser,
  StripeRevenue,
} from "@/lib/admin-queries";

function formatDate(): string {
  return new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "เมื่อกี้";
  if (mins < 60) return `${mins} นาที`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชม.`;
  const days = Math.floor(hours / 24);
  return `${days} วัน`;
}

export function OverviewShell({
  stats,
  dauData,
  recentUsers,
  revenue,
}: {
  stats: OverviewStats;
  dauData: DauRow[];
  recentUsers: RecentUser[];
  revenue: StripeRevenue;
}) {
  const chartData = dauData.map((d) => ({
    label: d.date.slice(5),
    bars: [{ value: d.dau, color: "var(--purple)", key: "dau" }],
  }));

  return (
    <div>
      <AdminPageHeader title={`ภาพรวมระบบ · ${formatDate()}`} />

      <div style={A.statGrid}>
        <AdminStatCard
          label="ผู้ใช้ทั้งหมด"
          value={stats.totalUsers}
          delta={stats.newUsers7d}
          deltaLabel="(7d)"
          tab="peach"
        />
        <AdminStatCard
          label="Premium"
          value={stats.premiumUsers}
          sub={`${((stats.premiumUsers / Math.max(1, stats.totalUsers)) * 100).toFixed(1)}%`}
          tab="purple"
        />
        <AdminStatCard
          label="รายได้ MTD"
          value={
            revenue.hasData
              ? `฿${revenue.amountThb.toLocaleString()}`
              : "—"
          }
          sub={
            revenue.hasData
              ? `${revenue.chargeCount} transactions`
              : "ไม่มีข้อมูล Stripe"
          }
          tab="mint"
        />
        <AdminStatCard
          label="AI calls วันนี้"
          value={stats.aiTodayNlp + stats.aiTodayVision}
          sub={`NLP ${stats.aiTodayNlp} · Vision ${stats.aiTodayVision}`}
          tab="yellow"
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <AdminBarChart
          title="DAU · 30 วัน"
          data={chartData}
          height={180}
          unit="คน"
          legend={[
            {
              key: "dau",
              color: "var(--purple)",
              label: "ผู้ใช้งานต่อวัน",
            },
          ]}
        />
      </div>

      {/* Recent users table */}
      <div style={A.cardFlush}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--w-rule)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={A.sectionTitle}>ผู้ใช้ล่าสุด</h2>
          <Link
            href="/admin/users"
            style={{
              color: "var(--purple-strong)",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["ผู้ใช้", "อีเมล", "แผน", "บันทึก", "เข้าใช้ล่าสุด", ""].map(
                (h) => (
                  <th key={h} style={A.th}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {recentUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    ...A.td,
                    textAlign: "center",
                    color: "var(--w-ink-3)",
                    padding: 32,
                  }}
                >
                  ยังไม่มีผู้ใช้
                </td>
              </tr>
            ) : (
              recentUsers.map((u, i) => {
                const initials = (u.name || u.email)
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderTop: "1px solid var(--w-rule)",
                    }}
                  >
                    <td style={{ ...A.td, borderBottom: "none" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
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
                              background:
                                "linear-gradient(135deg, var(--peach), var(--purple))",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 11,
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                        )}
                        <span style={{ fontWeight: 700 }}>
                          {u.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        ...A.td,
                        borderBottom: "none",
                        color: "var(--w-ink-3)",
                      }}
                    >
                      {u.email}
                    </td>
                    <td style={{ ...A.td, borderBottom: "none" }}>
                      <AdminBadge
                        variant={
                          u.plan === "premium"
                            ? "info"
                            : u.plan === "trial"
                              ? "warning"
                              : "free"
                        }
                      >
                        {u.plan === "premium"
                          ? "Premium"
                          : u.plan === "trial"
                            ? "Trial"
                            : "Free"}
                      </AdminBadge>
                    </td>
                    <td
                      style={{
                        ...A.td,
                        borderBottom: "none",
                        fontWeight: 700,
                      }}
                    >
                      {u.entryCount}
                    </td>
                    <td
                      style={{
                        ...A.td,
                        borderBottom: "none",
                        color: "var(--w-ink-3)",
                      }}
                    >
                      {timeAgo(u.createdAt)}
                    </td>
                    <td
                      style={{
                        ...A.td,
                        borderBottom: "none",
                        textAlign: "right",
                      }}
                    >
                      <Link
                        href={`/admin/users/${u.id}`}
                        style={{ color: "var(--w-ink-3)" }}
                      >
                        ⋯
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
