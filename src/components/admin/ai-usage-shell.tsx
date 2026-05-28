"use client";

import React from "react";
import Link from "next/link";
import { AdminBarChart } from "./admin-bar-chart";
import { A } from "./admin-ui";

interface DailyRow {
  date: string;
  nlp: number;
  vision: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

interface TopUser {
  userId: string;
  email: string;
  total: number;
}

export function AiUsageShell({
  daily,
  topUsers,
}: {
  daily: DailyRow[];
  topUsers: TopUser[];
}) {
  const chartData = daily.map((d) => ({
    label: d.date.slice(5),
    bars: [
      { value: d.vision, color: "var(--peach)", key: "vision" },
      { value: d.nlp, color: "var(--purple)", key: "nlp" },
    ],
  }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 20,
      }}
    >
      <AdminBarChart
        title="AI Calls 30 วันล่าสุด"
        data={chartData}
        height={180}
        legend={[
          { key: "nlp", color: "var(--purple)", label: "NLP" },
          { key: "vision", color: "var(--peach)", label: "Vision" },
        ]}
      />

      <div style={A.card}>
        <h2 style={{ ...A.sectionTitle, marginBottom: 16 }}>
          ผู้ใช้ AI สูงสุด (30 วัน)
        </h2>
        {topUsers.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>
            ไม่มีข้อมูล
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {topUsers.map((u, i) => (
              <div
                key={u.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 0",
                  borderBottom:
                    i < topUsers.length - 1
                      ? "1px solid var(--hairline)"
                      : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ink-3)",
                    width: 20,
                    textAlign: "right",
                  }}
                >
                  {i + 1}
                </span>
                <Link
                  href={`/admin/users/${u.userId}`}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "var(--purple)",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.email}
                </Link>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  {u.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
