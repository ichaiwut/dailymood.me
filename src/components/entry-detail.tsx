"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";

interface EntryData {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  intensity?: number;
  aiSummary?: string | null;
  createdAt: string | number;
}

/* Mock entry used when the API doesn't support single-entry fetch */
const MOCK_ENTRY: EntryData = {
  id: "mock-1",
  moodTypeId: "amazing",
  note: "Had a wonderful morning jog in the park. The weather was perfect and I felt really energized afterward. Met a friend for coffee too.",
  tags: ["🏃 Exercise", "☕ Coffee", "🌤 Outdoors", "🤝 Friends"],
  intensity: 4,
  aiSummary:
    "A positive start to the day driven by physical activity and social connection. Morning exercise correlates with your happiest entries — this pattern has held for 3 weeks.",
  createdAt: Date.now() - 3600000,
};

export function EntryDetail({ id }: { id: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/log?id=${id}`)
      .then((r) => (r.ok ? r.json() as Promise<Record<string, unknown>> : null))
      .then((data) => {
        if (!alive) return;
        if (data?.entry) {
          setEntry(data.entry as EntryData);
        } else if (data?.entries) {
          const found = (data.entries as EntryData[]).find((e) => e.id === id);
          setEntry(found ?? MOCK_ENTRY);
        } else {
          setEntry(MOCK_ENTRY);
        }
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setEntry(MOCK_ENTRY);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading || !entry) {
    return <LoadingSkeleton />;
  }

  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const moodEmoji = mood?.emoji ?? "·";
  const moodLabel = locale === "th" ? (mood?.labelTh ?? "Unknown") : (mood?.label ?? "Unknown");
  const date = new Date(entry.createdAt);
  const dayLabel = date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = date.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const intensity = entry.intensity ?? 3;
  const tags = entry.tags ?? [];

  return (
    <>
      {/* ── TOP BAR ─── */}
      <header className="flex items-center justify-between pt-4 pb-3 fade-in">
        <button className="icon-btn" aria-label="Back" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-3)" }}>
          {dayLabel}
        </span>
        <button className="icon-btn" aria-label="More">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </header>

      {/* ── MOOD HERO CARD ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "40ms" }}>
        <div
          style={{
            background: moodColor,
            borderRadius: 32,
            padding: "28px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Giant faded emoji */}
          <span
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              fontSize: 200,
              opacity: 0.25,
              lineHeight: 1,
              pointerEvents: "none",
              userSelect: "none",
            }}
            aria-hidden
          >
            {moodEmoji}
          </span>

          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                opacity: 0.7,
                letterSpacing: "0.4px",
                color: "#0A0A0A",
              }}
            >
              {locale === "th" ? "รู้สึก" : "FEELING"}
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: "#0A0A0A",
                lineHeight: 1.15,
                marginTop: 4,
              }}
            >
              {moodLabel}
            </div>
            <div
              style={{
                fontSize: 15,
                opacity: 0.8,
                color: "#0A0A0A",
                marginTop: 6,
              }}
            >
              {time} &middot; {dayLabel}
            </div>

            {/* Intensity bar */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  style={{
                    width: 28,
                    height: 8,
                    borderRadius: 4,
                    background: level <= intensity ? "#0A0A0A" : "rgba(10,10,10,0.15)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTE SECTION ─── */}
      {entry.note && (
        <section className="mb-5 fade-in" style={{ animationDelay: "80ms" }}>
          <div className="px-1">
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#A673F1",
                letterSpacing: "0.5px",
                display: "block",
                marginBottom: 8,
              }}
            >
              {locale === "th" ? "บันทึกของคุณ" : "YOUR NOTE"}
            </span>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--ink)",
              }}
            >
              {entry.note}
            </p>
          </div>
        </section>
      )}

      {/* ── AI SUMMARY ─── */}
      {entry.aiSummary && (
        <section className="mb-5 fade-in" style={{ animationDelay: "120ms" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)",
              borderRadius: 22,
              padding: 18,
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"
                  stroke="#A673F1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#A673F1",
                  letterSpacing: "0.4px",
                }}
              >
                AI SUMMARY
              </span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }}>
              {entry.aiSummary}
            </p>
          </div>
        </section>
      )}

      {/* ── TAGS ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "160ms" }}>
        <div className="px-1">
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#A673F1",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: 10,
            }}
          >
            TAGS
          </span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  background: "#fff",
                  border: "1.5px solid #ECECEC",
                  padding: "9px 14px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {tag}
              </span>
            ))}
            <button
              style={{
                background: "#F8F6FB",
                border: "none",
                padding: "9px 14px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                color: "#A673F1",
                cursor: "pointer",
              }}
            >
              + {locale === "th" ? "เพิ่ม" : "Add"}
            </button>
          </div>
        </div>
      </section>

      {/* ── ACTION BUTTONS ─── */}
      <section className="fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex gap-3">
          <button
            style={{
              flex: 1,
              height: 50,
              background: "#F8F6FB",
              color: "var(--ink)",
              border: "none",
              borderRadius: 18,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {locale === "th" ? "แก้ไข" : "Edit"}
          </button>
          <button
            style={{
              flex: 1,
              height: 50,
              background: "#F8F6FB",
              color: "var(--ink)",
              border: "none",
              borderRadius: 18,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {locale === "th" ? "เปรียบเทียบ" : "Compare"}
          </button>
        </div>
      </section>
    </>
  );
}

/* ─── Loading skeleton ─── */

function LoadingSkeleton() {
  return (
    <div className="fade-in">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between pt-4 pb-3">
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface-2)", opacity: 0.6 }} />
        <div style={{ width: 100, height: 14, borderRadius: 7, background: "var(--surface-2)", opacity: 0.5 }} />
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface-2)", opacity: 0.6 }} />
      </div>
      {/* Hero skeleton */}
      <div
        style={{
          height: 200,
          borderRadius: 32,
          background: "var(--surface-2)",
          opacity: 0.5,
          marginBottom: 20,
        }}
      />
      {/* Note skeleton */}
      <div className="space-y-2 px-1" style={{ marginBottom: 20 }}>
        <div style={{ height: 10, width: 80, background: "var(--surface-2)", borderRadius: 6, opacity: 0.6 }} />
        <div style={{ height: 12, width: "90%", background: "var(--surface-2)", borderRadius: 6, opacity: 0.4 }} />
        <div style={{ height: 12, width: "70%", background: "var(--surface-2)", borderRadius: 6, opacity: 0.4 }} />
      </div>
    </div>
  );
}
