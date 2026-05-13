"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";

interface SheetEntry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags: string[] | null;
  imageUrl: string | null;
  aiSummary: string | null;
  createdAt: string | number;
}

export type { SheetEntry };

export function EntryMiniCard({ entry, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: { entry: SheetEntry; pack?: string; iconFormat?: string }) {
  const locale = useLocale();
  const t = useTranslations("daySheet");
  const router = useRouter();

  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const moodLabel = locale === "th" ? mood?.labelTh : mood?.label;

  const date = new Date(entry.createdAt);
  const timeLabel = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={() => router.push(`/entry/${entry.id}` as "/")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/entry/${entry.id}` as "/"); }}
      style={{
        background: "#fff",
        border: "1.5px solid var(--hairline)",
        borderRadius: 18,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "box-shadow 150ms, border-color 150ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px -4px rgba(0,0,0,.08)";
        e.currentTarget.style.borderColor = moodColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--hairline)";
      }}
    >
      {/* Top row: mood icon + label + time + edit */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: entry.note || entry.imageUrl || (entry.tags && entry.tags.length > 0) ? 12 : 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: moodColor + "33",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {mood && <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={28} height={28} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
            {moodLabel}
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 2 }}>
            {timeLabel}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/entry/${entry.id}/edit` as "/"); }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--surface-2)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, color: "var(--ink-2)",
          }}
          aria-label={t("editEntry")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Note */}
      {entry.note && (
        <p style={{
          fontSize: 15, lineHeight: 1.55, color: "var(--ink)",
          margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {entry.note}
        </p>
      )}

      {/* Image thumbnail */}
      {entry.imageUrl && (
        <div style={{ marginTop: entry.note ? 10 : 0, borderRadius: 12, overflow: "hidden" }}>
          <img
            src={entry.imageUrl}
            alt=""
            style={{
              width: "100%", maxHeight: 280, objectFit: "contain",
              display: "block", background: "#F9F7F4",
            }}
          />
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 10 }}>
          {entry.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                background: moodColor + "22",
                padding: "4px 10px",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink-2)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
