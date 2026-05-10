"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";

interface EntryData {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  sentiment: number | null;
  aiSummary?: string | null;
  aiSource: string;
  imageUrl?: string | null;
  isPremium?: boolean;
  date: string;
  createdAt: string | number;
}

export function EntryDetail({ id }: { id: string }) {
  const locale = useLocale();
  const t = useTranslations("entry");
  const router = useRouter();
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/log/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setEntry(data as EntryData | null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!entry) {
    return (
      <div className="text-center py-20 fade-in">
        <div style={{ fontSize: 48, marginBottom: 12 }}>😶</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
          {t("notFound")}
        </p>
      </div>
    );
  }

  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const moodLabel = locale === "th" ? mood?.labelTh : mood?.label;
  const date = new Date(entry.createdAt);

  const dateLabel = date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isAi = entry.aiSource !== "manual";

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => router.back()}
          className="icon-btn"
          style={{ width: 40, height: 40, borderRadius: 12 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          {dateLabel}
        </span>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="icon-btn"
            style={{ width: 40, height: 40, borderRadius: 12 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="5" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 44,
                  background: "#fff",
                  borderRadius: 14,
                  padding: "6px 0",
                  minWidth: 160,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  border: "1px solid #F2F0F5",
                  zIndex: 50,
                }}
                className="pop"
              >
                <button
                  onClick={() => { setMenuOpen(false); router.push(`/entry/${id}/edit` as "/"); }}
                  className="flex items-center gap-2.5 w-full"
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    background: "none",
                    border: "none",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("edit")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Mood Hero Card ── */}
      <div
        className="mb-5"
        style={{
          background: moodColor + "99",
          borderRadius: 28,
          padding: "24px 22px",
          position: "relative",
          overflow: "hidden",
          minHeight: 160,
        }}
      >
        {mood && (
          <img
            src={mood.iconUrl}
            alt=""
            width={120}
            height={120}
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />
        )}
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.5px", marginBottom: 4 }}>
            {t("feeling")}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1, marginBottom: 8 }}>
            {moodLabel}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>
            {t("loggedAt", { time: timeLabel })}
          </div>
        </div>
      </div>

      {/* ── Your Note ── */}
      {entry.note && (
        <div className="mb-5">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px", marginBottom: 8 }}>
            {t("yourNote")}
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink)" }}>
            {entry.note}
          </p>
        </div>
      )}

      {/* ── AI Summary ── */}
      {(entry.aiSummary || entry.note) && <div className="mb-5">
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            background: "#FAF7FE",
            border: "1px solid #F0EAF7",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="#B89AE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#B89AE8", letterSpacing: "0.3px" }}>
              {t("aiSummary")}
            </span>
            {!entry.aiSummary && (
              <span style={{
                marginLeft: "auto",
                background: "#0A0A0A",
                color: "#fff",
                fontSize: 8,
                fontWeight: 800,
                padding: "1px 5px",
                borderRadius: 4,
                letterSpacing: "0.3px",
              }}>
                PRO
              </span>
            )}
          </div>
          {entry.aiSummary ? (
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
              <BoldMarkdown text={entry.aiSummary} />
            </p>
          ) : (
            <a href="/pricing" style={{ textDecoration: "none", display: "block" }}>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "#B89AE8", marginBottom: 6 }}>
                {t("aiSummaryTeaser")}
              </p>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#A673F1" }}>
                {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
              </span>
            </a>
          )}
        </div>
      </div>}

      {/* ── Moment (photo) ── */}
      {entry.imageUrl && (
        <div className="mb-5">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px", marginBottom: 8 }}>
            {t("moment")}
          </div>
          <img
            src={entry.imageUrl}
            alt=""
            className="w-full"
            style={{ borderRadius: 22, maxHeight: 300, objectFit: "cover" }}
          />
        </div>
      )}

      {/* ── Tags ── */}
      <div className="mb-5">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px", marginBottom: 8 }}>
          {t("tags")}
        </div>
        {entry.tags && entry.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  background: "#fff",
                  border: "1.5px solid #F2F0F5",
                  padding: "6px 14px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 16,
              background: "#FAF7FE",
              border: "1px solid #F0EAF7",
            }}
          >
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "#B89AE8" }}>
              {t("tagsTeaser")}
            </p>
          </div>
        )}
      </div>

      <div className="pb-6" />
    </div>
  );
}

function BoldMarkdown({ text }: { text: string }) {
  const parts = text.split(/\*\*/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="pt-16 space-y-4 fade-in">
      <div style={{ height: 160, borderRadius: 28, background: "var(--surface-2)", opacity: 0.6 }} />
      <div style={{ height: 16, width: "40%", borderRadius: 6, background: "var(--surface-2)", opacity: 0.5 }} />
      <div style={{ height: 60, borderRadius: 16, background: "var(--surface-2)", opacity: 0.4 }} />
      <div style={{ height: 100, borderRadius: 20, background: "var(--surface-2)", opacity: 0.35 }} />
    </div>
  );
}
