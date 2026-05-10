"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteFeedback } from "@/lib/admin-actions";

interface FeedbackRow {
  id: string;
  userId: string;
  email: string;
  message: string;
  createdAt: string;
}

interface SuggestionRow {
  title: string;
  up: number;
  down: number;
  routine: number;
  total: number;
}

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline)",
  borderRadius: 16,
  padding: 24,
};

export function FeedbackShell({
  feedback,
  totalFeedback,
  page,
  pageSize,
  suggestions,
}: {
  feedback: FeedbackRow[];
  totalFeedback: number;
  page: number;
  pageSize: number;
  suggestions: SuggestionRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.ceil(totalFeedback / pageSize);

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: "opacity 200ms" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>ความคิดเห็น</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
        <div style={CARD}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            จากผู้ใช้ ({totalFeedback})
          </h2>

          {feedback.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 14 }}>ไม่มีความคิดเห็น</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  style={{
                    padding: "14px 16px",
                    background: "var(--surface-2)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: "var(--ink)", marginBottom: 6 }}>
                    {fb.message}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      <Link
                        href={`/admin/users/${fb.userId}`}
                        style={{ color: "var(--purple)", textDecoration: "none" }}
                      >
                        {fb.email}
                      </Link>
                      {" · "}
                      {new Date(fb.createdAt).toLocaleDateString("th-TH")}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("ลบความคิดเห็นนี้?"))
                          startTransition(() => deleteFeedback(fb.id));
                      }}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid #FCC",
                        background: "#FFF5F5",
                        color: "#D44",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
                fontSize: 13,
                color: "var(--ink-2)",
              }}
            >
              <span>
                หน้า {page + 1} / {totalPages}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    router.push(`/admin/feedback?page=${page - 1}`)
                  }
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
                  onClick={() =>
                    router.push(`/admin/feedback?page=${page + 1}`)
                  }
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

        <div style={CARD}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            AI Suggestion Feedback
          </h2>

          {suggestions.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 14 }}>ไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map((s) => (
                <div
                  key={s.title}
                  style={{
                    padding: "12px 14px",
                    background: "var(--surface-2)",
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      marginBottom: 6,
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                    <span style={{ color: "#16A34A" }}>👍 {s.up}</span>
                    <span style={{ color: "#DC2626" }}>👎 {s.down}</span>
                    <span style={{ color: "var(--purple)" }}>🔄 {s.routine}</span>
                    <span style={{ color: "var(--ink-3)", marginLeft: "auto" }}>
                      รวม {s.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
