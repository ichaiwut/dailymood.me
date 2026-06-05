"use client";

import { PAClip } from "../pa-clip";
import { PAMark } from "../pa-mark";
import { PASticker } from "../pa-sticker";
import { SpecialDayBanner } from "@/components/special-day-banner";
import type { SpecialDay } from "@/db/schema";
import type { MoodPickItem } from "./types";

/** Greeting folder card — date tab over a paper sheet with the mood-picker
 *  sticker row. Tapping a mood opens the Smart Log modal pre-filled. */
export function GreetingFolder({
  locale,
  greetTime,
  dateTabLabel,
  moods,
  pack,
  iconFormat,
  specialDays,
  onMoodSelect,
}: {
  locale: string;
  greetTime: string;
  dateTabLabel: string;
  moods: MoodPickItem[];
  pack: string;
  iconFormat: string;
  specialDays: SpecialDay[];
  onMoodSelect: (id: string) => void;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 30 }}>
      <span className="pa-tab lav">{dateTabLabel}</span>
      <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "28px 32px 30px", position: "relative" }}>
        {/* glow clipped to the card; the paperclip is kept outside so it can overhang */}
        <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, var(--lavender), transparent 70%)", opacity: 0.45 }} />
        </div>
        <PAClip style={{ top: -15, right: 40, transform: "rotate(7deg)", zIndex: 8 }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", marginBottom: 6 }}>
            {greetTime} {locale === "th" ? "☀️" : ""}
          </div>
          <SpecialDayBanner days={specialDays} locale={locale} />
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "4px 0 22px", letterSpacing: "-0.022em", lineHeight: 1.12, color: "var(--w-ink)" }}>
            {locale === "th" ? <>วันนี้คุณรู้สึก <PAMark>ยังไง</PAMark>?</> : <>How are you <PAMark>feeling</PAMark>?</>}
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {moods.map((m) => {
              const label = (locale === "th" ? m.labelTh : m.label) ?? m.label;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMoodSelect(m.id)}
                  aria-label={label}
                  className="pa-card-lift"
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                >
                  <PASticker moodId={m.id} color={m.color} size={52} pack={pack} iconFormat={iconFormat} iconKey={m.iconKey} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)", whiteSpace: "nowrap" }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
