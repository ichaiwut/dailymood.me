"use client";

import { Link } from "@/i18n/navigation";
import { PASticker } from "../pa-sticker";
import type { TodayEntry } from "./types";

interface EntryMood {
  id: string;
  color: string;
  label: string;
  labelTh: string | null;
  iconKey: string | null;
}

/** A single today-entry as a Paper Desk folder card (tab + rotated sheet). */
export function EntryFolderCard({
  entry,
  mood,
  locale,
  blur,
  pack,
  iconFormat,
  tabLabel,
  tabVariant,
  rotation,
}: {
  entry: TodayEntry;
  mood?: EntryMood;
  locale: string;
  blur?: boolean;
  pack: string;
  iconFormat: string;
  tabLabel: string;
  tabVariant: "" | "mint" | "lav";
  rotation: number;
}) {
  const time = new Date(entry.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const moodLabel = mood ? ((locale === "th" ? mood.labelTh : mood.label) ?? mood.label) : "";
  const blurStyle = blur ? { filter: "blur(6px)", userSelect: "none" as const } : undefined;

  return (
    <div style={{ position: "relative" }}>
      <span className={`pa-tab ${tabVariant}`} style={{ fontSize: 12, padding: "8px 15px 10px" }}>{tabLabel}</span>
      <Link
        href={`/entry/${entry.id}` as "/"}
        className="pa-sheet pa-card-lift block"
        style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", transform: `rotate(${rotation}deg)`, padding: "16px 16px 18px", textDecoration: "none", color: "inherit" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mood ? (
              <PASticker moodId={mood.id} color={mood.color} size={40} borderWidth={3} pack={pack} iconFormat={iconFormat} iconKey={mood.iconKey} style={{ transform: "rotate(-6deg)" }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--w-tint)", flexShrink: 0 }} aria-hidden />
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-ink)" }}>{moodLabel}</div>
              <div style={{ fontSize: 11, color: "var(--w-ink-3)", fontWeight: 700 }}>{time}</div>
            </div>
          </div>
          <span aria-hidden style={{ fontSize: 18, color: "var(--w-ink-3)", letterSpacing: 1, lineHeight: 1, flexShrink: 0 }}>⋯</span>
        </div>

        {entry.imageUrl && (
          <div style={{ height: 78, borderRadius: 10, marginBottom: 12, overflow: "hidden", position: "relative" }}>
            <img src={entry.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {entry.note && (
          <p className="line-clamp-2" style={{ fontSize: 14, color: "var(--w-ink-2)", margin: "0 0 12px", lineHeight: 1.55, flex: 1, ...blurStyle }}>
            {entry.note}
          </p>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", ...blurStyle }}>
            {entry.tags.slice(0, 3).map((tag, j) => (
              <span key={j} style={{ padding: "4px 10px", borderRadius: 100, background: "var(--w-tint)", color: "var(--w-ink-2)", fontSize: 11, fontWeight: 700 }}>#{tag}</span>
            ))}
          </div>
        )}

        {entry.location && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden", marginTop: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="var(--w-ink-3)" />
            </svg>
            <span style={{ fontSize: 12, color: "var(--w-ink-3)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.location}</span>
          </div>
        )}
      </Link>
    </div>
  );
}
