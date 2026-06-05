"use client";

import { moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";
import { VoiceButton } from "@/components/voice-button";
import { LocationSearch } from "@/components/location-picker";
import { ActivityPicker } from "@/components/activity-picker";
import { PaperIconButton } from "@/components/paper/paper-icon-button";
import { Link, useRouter } from "@/i18n/navigation";
import type { MoodItem, Tier } from "./types";

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg>
);

export function SLInput({
  locale,
  tier,
  allMoods,
  moodId,
  onMoodChange,
  text,
  onTextChange,
  placeholder,
  imagePreview,
  onImageSelect,
  onImageClear,
  location,
  showLocationSearch,
  onLocationToggle,
  onLocationSelect,
  onLocationClear,
  activityId,
  onActivityChange,
  aiRemaining,
  aiLimit,
  hasInput,
  errorText,
  pack,
  iconFormat,
  busy,
  onVoiceTranscript,
  onAnalyze,
  onSave,
  onCancel,
}: {
  locale: string;
  tier: Tier;
  allMoods: MoodItem[];
  moodId: string;
  onMoodChange: (id: string) => void;
  text: string;
  onTextChange: (v: string) => void;
  placeholder: string;
  imagePreview: string | null;
  onImageSelect: (f: File) => void;
  onImageClear: () => void;
  location: string;
  showLocationSearch: boolean;
  onLocationToggle: () => void;
  onLocationSelect: (v: string, lat?: number, lng?: number) => void;
  onLocationClear: () => void;
  activityId: string | null;
  onActivityChange: (id: string | null) => void;
  aiRemaining: number | null;
  aiLimit: number | null;
  hasInput: boolean;
  errorText: string | null;
  pack: string;
  iconFormat: string;
  busy: boolean;
  onVoiceTranscript: (s: string) => void;
  onAnalyze: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const iconSrc = (m: MoodItem) => (m.iconKey ? `${R2_PUBLIC_URL}/${m.iconKey}` : moodIconUrl(m.id, pack, iconFormat));
  const quotaReached = aiRemaining !== null && aiRemaining <= 0;
  const router = useRouter();

  return (
    <div style={{ padding: "18px 28px 26px" }}>
      {/* mood tiles */}
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--w-ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 11 }}>
        {locale === "th" ? "อารมณ์ของคุณ" : "Your mood"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 9, marginBottom: 22 }}>
        {allMoods.map((m) => {
          const on = m.id === moodId;
          const label = locale === "th" ? (m.labelTh ?? m.label) : m.label;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onMoodChange(m.id)}
              aria-pressed={on}
              aria-label={label}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "11px 4px 9px", borderRadius: 14,
                background: "var(--w-surface)", border: on ? "2px solid var(--w-ink)" : "1px solid var(--w-rule)", cursor: "pointer", fontFamily: "inherit",
                boxShadow: on ? "0 9px 20px -9px rgba(0,0,0,.3)" : "0 4px 12px -7px rgba(60,40,20,.28)", transform: on ? "translateY(-1px)" : "none",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: on ? m.color : "var(--w-tint)", display: "grid", placeItems: "center" }}>
                <img src={iconSrc(m)} alt="" width={30} height={30} style={{ display: "block", pointerEvents: "none" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: on ? 800 : 600, color: on ? "var(--w-ink)" : "var(--w-ink-2)", whiteSpace: "nowrap" }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* note */}
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", minHeight: 120, borderRadius: 14, border: "1.5px solid var(--w-rule)", background: "var(--w-surface-2)", padding: "15px 17px", color: "var(--w-ink)", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", fontFamily: "inherit" }}
      />

      {imagePreview && (
        <div style={{ position: "relative", marginTop: 12, display: "inline-block" }}>
          <img src={imagePreview} alt="" style={{ maxWidth: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 12, display: "block" }} />
          <button onClick={onImageClear} aria-label={locale === "th" ? "ลบรูป" : "Remove image"} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,.5)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}

      {location && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 12px", borderRadius: 100, background: "var(--w-tint)", maxWidth: "100%" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#A673F1" /></svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
          <button type="button" onClick={onLocationClear} aria-label={locale === "th" ? "ลบสถานที่" : "Remove location"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="var(--w-ink-3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}

      {/* controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
        <VoiceButton onTranscript={onVoiceTranscript} />
        {tier === "premium" ? (
          <PaperIconButton asLabel title={locale === "th" ? "แนบรูป" : "Attach photo"} ariaLabel={locale === "th" ? "แนบรูป" : "Attach photo"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageSelect(f); }} />
          </PaperIconButton>
        ) : (
          <PaperIconButton
            badge="PRO"
            onClick={() => router.push("/pricing" as "/")}
            title={locale === "th" ? "แนบรูป (Pro)" : "Attach photo (Pro)"}
            ariaLabel={locale === "th" ? "แนบรูป — อัปเกรดเป็น Pro" : "Attach photo — upgrade to Pro"}
            style={{ opacity: 0.55 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </PaperIconButton>
        )}
        <PaperIconButton
          active={showLocationSearch}
          onClick={onLocationToggle}
          title={locale === "th" ? "สถานที่" : "Location"}
          ariaLabel={locale === "th" ? "เพิ่มสถานที่" : "Add location"}
        >
          <PinIcon />
        </PaperIconButton>
        {aiLimit !== null && aiRemaining !== null && (
          <span style={{ marginLeft: "auto", fontSize: 14, color: "var(--w-ink-3)", fontWeight: 700 }}>
            {locale === "th" ? "เหลือ AI วันนี้ " : "AI remaining "}<b style={{ color: "var(--w-ink-2)" }}>{aiRemaining} / {aiLimit}</b>
          </span>
        )}
      </div>

      {showLocationSearch && (
        <LocationSearch locale={locale} onSelect={onLocationSelect} onClose={onLocationToggle} />
      )}

      {errorText && (
        <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "var(--w-surface-2)", border: "1px solid var(--w-rule)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#D14343", margin: 0 }}>{errorText}</p>
        </div>
      )}

      {/* activities */}
      <div style={{ marginTop: 16 }}>
        <ActivityPicker value={activityId} onChange={onActivityChange} />
      </div>

      {/* PRO teaser (free users) */}
      {tier !== "premium" && (
        <Link href={"/pricing" as "/"} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", marginTop: 18, padding: "14px 16px", borderRadius: 14, background: "var(--w-ai-grad)" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, var(--purple), #C9A6F5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink-2)", lineHeight: 1.5 }}>
            <b style={{ color: "var(--purple-strong)" }}>PRO</b> · {locale === "th" ? "AI อ่านสิ่งที่คุณเขียน แล้วสรุปอารมณ์ แท็ก และ insight ให้อัตโนมัติ" : "AI reads your text and extracts mood, tags, and insights automatically"}{" "}
            <span style={{ color: "var(--purple-strong)", fontWeight: 800 }}>{locale === "th" ? "อัปเกรด →" : "Upgrade →"}</span>
          </span>
        </Link>
      )}

      {/* footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <button onClick={onCancel} style={{ height: 44, padding: "0 20px", borderRadius: 12, border: "1.5px solid var(--w-rule)", background: "var(--w-surface)", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)" }}>
          {locale === "th" ? "ยกเลิก" : "Cancel"}
        </button>
        <button
          onClick={onAnalyze}
          disabled={!hasInput || quotaReached}
          className="pa-btn purple"
          style={{ height: 44, padding: "0 20px", opacity: !hasInput || quotaReached ? 0.5 : 1 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {quotaReached ? (locale === "th" ? "หมดโควต้า" : "Quota reached") : (locale === "th" ? "วิเคราะห์" : "Analyze")}
        </button>
        <button onClick={onSave} disabled={busy || !hasInput} className="pa-btn" style={{ height: 44, padding: "0 24px", opacity: busy || !hasInput ? 0.5 : 1 }}>
          {busy ? (locale === "th" ? "กำลังบันทึก..." : "Saving...") : (locale === "th" ? "บันทึก" : "Save")}
        </button>
      </div>
    </div>
  );
}
