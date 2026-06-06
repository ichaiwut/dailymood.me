"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteFeedback, archiveFeedback } from "@/lib/admin-actions";
import { AdminPageHeader } from "./admin-page-header";
import { AdminStatCard } from "./admin-stat-card";
import { A } from "./admin-ui";

interface FeedbackRow {
  id: string;
  userId: string;
  email: string;
  message: string;
  type: string | null;
  rating: number | null;
  status: string;
  createdAt: string;
}

interface SuggestionRow {
  title: string;
  up: number;
  down: number;
  routine: number;
  total: number;
}

const TYPE_EMOJI: Record<string, string> = {
  nps: "📈",
  bug: "🐛",
  request: "💡",
  praise: "❤️",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(diff / 60_000))}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function Stars({ count }: { count: number }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 1 }}>
      {"⭐".repeat(Math.min(count, 5))}
    </span>
  );
}

export function FeedbackShell({
  feedback,
  totalFeedback,
  pendingCount,
  page,
  pageSize,
  statusFilter,
  suggestions,
}: {
  feedback: FeedbackRow[];
  totalFeedback: number;
  pendingCount: number;
  page: number;
  pageSize: number;
  statusFilter: string;
  suggestions: SuggestionRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.ceil(totalFeedback / pageSize);

  const bugCount = feedback.filter((f) => f.type === "bug").length;
  const requestCount = feedback.filter((f) => f.type === "request").length;
  const praiseCount = feedback.filter((f) => f.type === "praise").length;

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: "opacity 200ms" }}>
      <AdminPageHeader
        title="Feedback"
        subtitle={`${pendingCount} รายการรอตอบ`}
      />

      {/* Stat cards row */}
      <div style={A.statGrid}>
        <AdminStatCard label="NPS" value="—" sub="ยังไม่มีข้อมูล" tab="purple" />
        <AdminStatCard label="Bugs" value={bugCount} tab="yellow" />
        <AdminStatCard label="Requests" value={requestCount} tab="mint" />
        <AdminStatCard label="Praise" value={praiseCount} tab="peach" />
      </div>

      {/* Feedback list */}
      <div style={A.cardFlush}>
        {feedback.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 14,
            }}
          >
            ยังไม่มี feedback ที่รอตอบ ✨
          </div>
        ) : (
          feedback.map((fb, i) => {
            const emoji = fb.type ? TYPE_EMOJI[fb.type] ?? "💬" : "💬";
            return (
              <div
                key={fb.id}
                style={{
                  padding: 18,
                  borderTop: i > 0 ? "1px solid var(--hairline)" : "none",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                {/* Type emoji */}
                <div style={{ fontSize: 24, lineHeight: 1, paddingTop: 2 }}>
                  {emoji}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  {/* Stars + user + time */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    {fb.rating && <Stars count={fb.rating} />}
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      <Link
                        href={`/admin/users/${fb.userId}`}
                        style={{
                          color: "var(--ink-3)",
                          textDecoration: "none",
                        }}
                      >
                        {fb.email.split("@")[0]}@
                      </Link>
                      {" · "}
                      {timeAgo(fb.createdAt)}
                    </span>
                  </div>

                  {/* Message */}
                  <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>
                    &ldquo;{fb.message}&rdquo;
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    style={{
                      ...A.btnSmall,
                      background: "var(--surface)",
                      fontFamily: "inherit",
                    }}
                  >
                    ตอบ
                  </button>
                  <button
                    onClick={() =>
                      startTransition(() => archiveFeedback(fb.id))
                    }
                    style={{
                      ...A.btnSmall,
                      background: "var(--surface)",
                      fontFamily: "inherit",
                    }}
                  >
                    เก็บ
                  </button>
                </div>
              </div>
            );
          })
        )}

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
            <span>
              หน้า {page + 1} / {totalPages}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() =>
                  router.push(`/admin/feedback?page=${page - 1}`)
                }
                disabled={page === 0}
                style={{
                  ...A.btnSmall,
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
                  ...A.btnSmall,
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
