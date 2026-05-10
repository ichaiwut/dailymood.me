"use client";

import React from "react";
import Link from "next/link";

interface DailyRow {
  date: string;
  nlp: number;
  vision: number;
}

interface TopUser {
  userId: string;
  email: string;
  total: number;
}

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline)",
  borderRadius: 16,
  padding: 24,
};

export function AiUsageShell({
  daily,
  topUsers,
}: {
  daily: DailyRow[];
  topUsers: TopUser[];
}) {
  const maxVal = Math.max(1, ...daily.map((d) => d.nlp + d.vision));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
      <div style={CARD}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          AI Calls 30 วันล่าสุด
        </h2>
        {daily.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>ไม่มีข้อมูล</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 160 }}>
            {daily.map((d) => {
              const nlpH = (d.nlp / maxVal) * 140;
              const visH = (d.vision / maxVal) * 140;
              return (
                <div
                  key={d.date}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                  }}
                  title={`${d.date}\nNLP: ${d.nlp}\nVision: ${d.vision}`}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 16,
                      borderRadius: "4px 4px 0 0",
                      background: "var(--peach)",
                      height: visH,
                    }}
                  />
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 16,
                      borderRadius: d.vision > 0 ? 0 : "4px 4px 0 0",
                      background: "var(--purple)",
                      height: nlpH,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            marginTop: 12,
            fontSize: 12,
            color: "var(--ink-3)",
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "var(--purple)",
                marginRight: 4,
              }}
            />
            NLP
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "var(--peach)",
                marginRight: 4,
              }}
            />
            Vision
          </span>
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          ผู้ใช้ AI สูงสุด (30 วัน)
        </h2>
        {topUsers.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>ไม่มีข้อมูล</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topUsers.map((u, i) => (
              <div
                key={u.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 0",
                  borderBottom: i < topUsers.length - 1 ? "1px solid var(--hairline)" : "none",
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
                    fontSize: 13,
                    color: "var(--purple)",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.email}
                </Link>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
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
