"use client";

import { moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";
import { ActivityPicker } from "@/components/activity-picker";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import type { AiSuggestion, MoodItem } from "./types";

/** Smart Log — AI result view. Mood, tags and summary are editable; the note
 *  the user wrote is shown read-only for context. */
export function SLResult({
  locale,
  allMoods,
  moodId,
  onMoodChange,
  text,
  tags,
  tagInput,
  onTagInputChange,
  onTagAdd,
  onTagRemove,
  activityId,
  onActivityChange,
  suggestion,
  pack,
  iconFormat,
  busy,
  onSave,
  onWriteMyself,
  onCancel,
}: {
  locale: string;
  allMoods: MoodItem[];
  moodId: string;
  onMoodChange: (id: string) => void;
  text: string;
  tags: string[];
  tagInput: string;
  onTagInputChange: (v: string) => void;
  onTagAdd: () => void;
  onTagRemove: (i: number) => void;
  activityId: string | null;
  onActivityChange: (id: string | null) => void;
  suggestion: AiSuggestion;
  pack: string;
  iconFormat: string;
  busy: boolean;
  onSave: () => void;
  onWriteMyself: () => void;
  onCancel: () => void;
}) {
  const iconSrc = (m: MoodItem) => (m.iconKey ? `${R2_PUBLIC_URL}/${m.iconKey}` : moodIconUrl(m.id, pack, iconFormat));

  return (
    <div style={{ padding: "18px 28px 26px" }}>
      {/* the note (read-only context) */}
      {text && (
        <div style={{ borderRadius: 14, border: "1.5px solid var(--w-rule)", background: "#FBF7F0", padding: "15px 17px", fontSize: 15, lineHeight: 1.6, color: "var(--w-ink)" }}>
          {text}
        </div>
      )}

      {/* AI result — washi-taped tinted paper */}
      <div className="pa-sheet" style={{ borderRadius: 18, padding: "22px 24px", marginTop: text ? 22 : 0, position: "relative", background: "linear-gradient(135deg, #F1E7FA, #F8EDEB)" }}>
        <span className="pa-washi yellow" aria-hidden style={{ width: 100 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 16 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="var(--purple-strong)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--purple-strong)", textTransform: "uppercase", letterSpacing: ".06em" }}>{locale === "th" ? "AI วิเคราะห์ให้" : "AI analysis"}</span>
          <span style={{ fontSize: 11, color: "var(--w-ink-3)", fontWeight: 600 }}>· {locale === "th" ? "แก้ไขได้" : "editable"}</span>
        </div>

        {/* mood */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)", minWidth: 54 }}>{locale === "th" ? "อารมณ์:" : "Mood:"}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {allMoods.map((m) => {
              const on = m.id === moodId;
              const size = on ? 40 : 34;
              const label = locale === "th" ? (m.labelTh ?? m.label) : m.label;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMoodChange(m.id)}
                  aria-pressed={on}
                  aria-label={label}
                  style={{
                    width: size, height: size, borderRadius: "50%", padding: 0, cursor: "pointer",
                    background: on ? m.color : "#fff", border: `${on ? 3 : 2}px solid #fff`,
                    boxShadow: on ? `0 9px 18px -6px ${m.color}` : "0 4px 10px -6px rgba(60,40,20,.3)",
                    transform: on ? "rotate(-6deg)" : "none", display: "grid", placeItems: "center", flexShrink: 0,
                  }}
                >
                  <img src={iconSrc(m)} alt="" width={Math.round(size * 0.72)} height={Math.round(size * 0.72)} style={{ display: "block", pointerEvents: "none" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* tags */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)", minWidth: 54 }}>{locale === "th" ? "แท็ก:" : "Tags:"}</span>
          {tags.map((tag, i) => (
            <span key={i} className="pa-chip" style={{ fontSize: 12, padding: "6px 11px" }}>
              #{tag}
              <button onClick={() => onTagRemove(i)} aria-label={locale === "th" ? `ลบแท็ก ${tag}` : `Remove tag ${tag}`} style={{ color: "var(--w-ink-3)", cursor: "pointer", background: "none", border: "none", padding: 0, display: "flex" }}>×</button>
            </span>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); onTagAdd(); }} style={{ display: "inline-flex" }}>
            <input
              value={tagInput}
              onChange={(e) => onTagInputChange(e.target.value)}
              placeholder={locale === "th" ? "+ เพิ่ม" : "+ Add"}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onTagAdd(); } }}
              style={{ width: tagInput ? 110 : 64, padding: "6px 12px", borderRadius: 100, background: "transparent", border: "1.5px dashed var(--w-rule-strong)", color: "var(--w-ink-3)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, outline: "none" }}
            />
          </form>
        </div>

        {/* activity */}
        <ActivityPicker value={activityId} onChange={onActivityChange} />

        {/* summary */}
        {suggestion.aiSummary && (
          <div style={{ padding: "14px 16px", background: "rgba(255,255,255,.72)", borderRadius: 12, marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--w-ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{locale === "th" ? "สรุป" : "Summary"}</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--w-ink)" }} dangerouslySetInnerHTML={{ __html: suggestion.aiSummary.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <AiDisclaimer variant="parse" />
        </div>
      </div>

      {/* footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <button onClick={onCancel} style={{ height: 44, padding: "0 20px", borderRadius: 12, border: "1.5px solid var(--w-rule)", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)" }}>
          {locale === "th" ? "ยกเลิก" : "Cancel"}
        </button>
        <button onClick={onWriteMyself} style={{ height: 44, padding: "0 20px", borderRadius: 12, border: "1.5px solid var(--w-rule)", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)" }}>
          {locale === "th" ? "เขียนเอง" : "Write myself"}
        </button>
        <button onClick={onSave} disabled={busy} className="pa-btn" style={{ height: 44, padding: "0 26px", opacity: busy ? 0.5 : 1 }}>
          {busy ? (locale === "th" ? "กำลังบันทึก..." : "Saving...") : (locale === "th" ? "บันทึก" : "Save")}
        </button>
      </div>
    </div>
  );
}
