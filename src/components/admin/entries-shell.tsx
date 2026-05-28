"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteEntry } from "@/lib/admin-actions";
import { AdminPageHeader } from "./admin-page-header";
import { AdminStatCard } from "./admin-stat-card";
import { A } from "./admin-ui";

interface EntryRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  userImage: string | null;
  moodEmoji: string;
  moodLabel: string;
  moodLabelTh: string | null;
  moodColor: string | null;
  aiSource: string;
  note: string | null;
  tags: string[];
  aiSummary: string | null;
  hasImage: boolean;
  date: string;
  createdAt: string;
}

interface MoodDist {
  emoji: string;
  label: string;
  labelTh: string;
  color: string;
  count: number;
}

interface EntryStats {
  entriesToday: number;
  entriesYesterday: number;
  entries7d: number;
  entries30d: number;
  withImage7d: number;
  aiTagged30d: number;
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

function MoodBar({ distribution }: { distribution: MoodDist[] }) {
  const total = distribution.reduce((s, m) => s + m.count, 0);
  if (total === 0) return null;

  return (
    <div style={{ ...A.card, padding: "18px 22px", marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h3 style={{ ...A.sectionTitle, margin: 0 }}>
          การกระจายอารมณ์ · 30 วัน
        </h3>
      </div>

      {/* Stacked horizontal bar */}
      <div
        style={{
          display: "flex",
          height: 18,
          borderRadius: 9,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        {distribution.map((m) => (
          <div
            key={m.label}
            style={{
              width: `${(m.count / total) * 100}%`,
              background: m.color,
              minWidth: m.count > 0 ? 4 : 0,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          fontSize: 12,
          color: "var(--ink-2)",
        }}
      >
        {distribution.map((m) => {
          const pct = ((m.count / total) * 100).toFixed(0);
          return (
            <span
              key={m.label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 50,
                  background: m.color,
                  flexShrink: 0,
                }}
              />
              {m.emoji} {m.labelTh} {m.count.toLocaleString()} · {pct}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function EntriesShell({
  entries,
  total,
  page,
  pageSize,
  userId,
  stats,
  moodDistribution,
}: {
  entries: EntryRow[];
  total: number;
  page: number;
  pageSize: number;
  userId: string;
  stats: EntryStats;
  moodDistribution: MoodDist[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / pageSize);

  function nav(params: Record<string, string>) {
    const sp = new URLSearchParams({ page: String(page), ...params });
    if (userId) sp.set("userId", userId);
    router.push(`/admin/entries?${sp}`);
  }

  const todayDelta =
    stats.entriesYesterday > 0
      ? Math.round(
          ((stats.entriesToday - stats.entriesYesterday) /
            stats.entriesYesterday) *
            100,
        )
      : 0;

  const imagePct =
    stats.entries7d > 0
      ? Math.round((stats.withImage7d / stats.entries7d) * 100)
      : 0;

  const aiPct =
    stats.entries30d > 0
      ? Math.round((stats.aiTagged30d / stats.entries30d) * 100)
      : 0;

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: "opacity 200ms" }}>
      <AdminPageHeader
        title="Entries"
        subtitle={`${stats.entries30d.toLocaleString()} บันทึกใน 30 วัน`}
        actions={
          userId ? (
            <button
              onClick={() => router.push("/admin/entries")}
              style={A.btnGhost}
            >
              ✕ ล้าง filter
            </button>
          ) : undefined
        }
      />

      {/* Stat cards */}
      <div style={A.statGrid}>
        <AdminStatCard
          label="วันนี้"
          value={stats.entriesToday}
          sub={
            todayDelta !== 0
              ? `${todayDelta > 0 ? "+" : ""}${todayDelta}% vs เมื่อวาน`
              : undefined
          }
          delta={todayDelta !== 0 ? todayDelta : undefined}
        />
        <AdminStatCard
          label="7 วัน"
          value={stats.entries7d}
        />
        <AdminStatCard
          label="มีรูปประกอบ"
          value={`${imagePct}%`}
          sub={`${stats.withImage7d.toLocaleString()} entries 7d`}
        />
        <AdminStatCard
          label="AI TAGGED"
          value={`${aiPct}%`}
          sub={`${stats.aiTagged30d.toLocaleString()} entries 30d`}
        />
      </div>

      {/* Mood distribution bar */}
      <MoodBar distribution={moodDistribution} />

      {/* Entries table */}
      <div style={A.cardFlush}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1.3fr 2fr 1.2fr 1fr 40px",
            gap: 8,
            padding: "12px 18px",
            background: "var(--surface-2)",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <div>ลำดับ</div>
          <div>ผู้ใช้</div>
          <div>เนื้อหา</div>
          <div>AI SUMMARY</div>
          <div>SOURCE · เวลา</div>
          <div />
        </div>

        {/* Empty state */}
        {entries.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 14,
            }}
          >
            ไม่มีบันทึก
          </div>
        )}

        {/* Rows */}
        {entries.map((e, i) => {
          const rowNum = page * pageSize + i + 1;
          const sourceName =
            e.aiSource === "manual"
              ? "Manual"
              : e.aiSource.includes("vision")
                ? "Vision"
                : "NLP";

          return (
            <div
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1.3fr 2fr 1.2fr 1fr 40px",
                gap: 8,
                padding: "14px 18px",
                borderTop: "1px solid var(--hairline)",
                alignItems: "center",
                fontSize: 14,
              }}
            >
              {/* Row number + mood emoji */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 20 }}>{e.moodEmoji}</span>
              </div>

              {/* User */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {e.userImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={e.userImage}
                    alt=""
                    width={32}
                    height={32}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 50,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 50,
                      background: e.moodColor || `hsl(${i * 47}, 60%, 70%)`,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {(e.userName || e.userEmail)
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <Link
                    href={`/admin/users/${e.userId}`}
                    style={{
                      color: "var(--ink)",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {e.userName || e.userEmail.split("@")[0]}@
                  </Link>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                    }}
                  >
                    {e.moodLabelTh || e.moodLabel}
                  </div>
                </div>
              </div>

              {/* Content: note + tags */}
              <div>
                {e.note && (
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--ink)",
                      marginBottom: e.tags.length > 0 ? 6 : 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    &ldquo;{e.note.slice(0, 100)}
                    {e.note.length > 100 ? "..." : ""}&rdquo;
                  </div>
                )}
                {e.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    {e.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "var(--surface-2)",
                          color: "var(--ink-3)",
                          fontWeight: 600,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {e.tags.length > 4 && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-3)",
                        }}
                      >
                        +{e.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
                {!e.note && e.tags.length === 0 && (
                  <span style={{ color: "var(--ink-3)", fontSize: 12 }}>
                    —
                  </span>
                )}
              </div>

              {/* AI Summary */}
              <div
                style={{
                  fontSize: 12,
                  color: e.aiSummary ? "var(--purple)" : "var(--ink-3)",
                  fontWeight: e.aiSummary ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.aiSummary || "—"}
              </div>

              {/* Source + time */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {sourceName}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {timeAgo(e.createdAt)}
                </div>
              </div>

              {/* Delete */}
              <div>
                <button
                  onClick={() => {
                    if (confirm("ลบบันทึกนี้?"))
                      startTransition(() => deleteEntry(e.id));
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-3)",
                    fontSize: 16,
                    padding: 4,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
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
              แสดง {entries.length} จาก {total.toLocaleString()}
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
                    Math.max(0, Math.min(page - 2, totalPages - 5)) + k;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => nav({ page: String(p) })}
                      style={{
                        ...A.btnSmall,
                        background:
                          p === page ? "var(--ink)" : "var(--surface)",
                        color: p === page ? "#fff" : "var(--ink-2)",
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
