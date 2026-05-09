"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";

interface SheetEntry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags: string[] | null;
  imageUrl: string | null;
  createdAt: string | number;
}

export type { SheetEntry };

export function EntryMiniCard({ entry }: { entry: SheetEntry }) {
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
    <div>
      {/* Mood card */}
      <div
        style={{
          background: moodColor + "33",
          borderRadius: 20,
          padding: "16px 18px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {mood && (
          <img
            src={mood.iconUrl}
            alt=""
            width={80}
            height={80}
            style={{
              position: "absolute",
              right: 6,
              bottom: -4,
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
        )}
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--ink-3)",
              letterSpacing: "0.5px",
              marginBottom: 2,
            }}
          >
            {t("feeling")}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--ink)",
              lineHeight: 1.2,
            }}
          >
            {moodLabel}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-2)",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {t("loggedAt", { time: timeLabel })}
          </div>
        </div>
      </div>

      {/* Note preview */}
      {entry.note && (
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--ink)",
            marginTop: 12,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {entry.note}
        </p>
      )}

      {/* Image thumbnail */}
      {entry.imageUrl && (
        <img
          src={entry.imageUrl}
          alt=""
          style={{
            width: "100%",
            maxHeight: 140,
            objectFit: "cover",
            borderRadius: 16,
            marginTop: 10,
          }}
        />
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 10 }}>
          {entry.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                background: "#fff",
                border: "1.5px solid #F2F0F5",
                padding: "4px 10px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-2"
        style={{ marginTop: 12 }}
      >
        <button
          onClick={() => router.push(`/entry/${entry.id}/edit` as "/")}
          className="icon-btn"
          style={{ width: 40, height: 40, borderRadius: 12 }}
          aria-label={t("editEntry")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => router.push(`/entry/${entry.id}` as "/")}
          className="flex-1 flex items-center justify-center gap-2"
          style={{
            height: 44,
            background: "var(--ink)",
            color: "#fff",
            border: "none",
            borderRadius: 100,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {t("openEntry")}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
