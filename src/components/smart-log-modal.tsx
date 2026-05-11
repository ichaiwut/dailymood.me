"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";
import { optimizeImage } from "@/lib/client-image";
import { VoiceButton } from "./voice-button";

type Tier = "guest" | "free" | "premium";

interface AiSuggestion {
  suggestedMoodId: string;
  sentiment: number | null;
  tags: string[];
  imageKey: string | null;
  aiSource: "manual" | "nlp" | "vision" | "nlp+vision";
  aiSummary: string | null;
}

interface Props {
  tier: Tier;
  onClose: () => void;
  onSaved: () => void;
  pack?: string;
  iconFormat?: string;
  preSelectedMoodId?: string;
  presetDate?: string;
  customMoods?: { id: string; emoji: string; label: string; labelTh: string | null; color: string; iconKey: string | null }[];
}

export function SmartLogModal({
  tier,
  onClose,
  onSaved,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
  preSelectedMoodId,
  presetDate,
  customMoods = [],
}: Props) {
  const t = useTranslations("smart");
  const locale = useLocale();
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [moodId, setMoodId] = useState<string>(preSelectedMoodId ?? "neutral");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiCooldown, setAiCooldown] = useState(false);

  const allMoods = [
    ...DEFAULT_MOODS.map((m) => ({ ...m, iconKey: null as string | null })),
    ...customMoods,
  ];
  const selectedMood = allMoods.find((m) => m.id === moodId);
  const hasInput = text.trim().length > 0 || !!imageFile;

  const now = new Date();
  const displayDate = presetDate ? new Date(presetDate + "T12:00:00") : now;
  const dateFull = displayDate.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  function iconSrc(m: { id: string; iconKey: string | null }) {
    if (m.iconKey) return `${R2_PUBLIC_URL}/${m.iconKey}`;
    return moodIconUrl(m.id, pack, iconFormat);
  }

  function addTag() {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags((p) => [...p, val]);
      setTagInput("");
    }
  }

  async function handleAnalyze() {
    if (!text.trim() && !imageFile) return;
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append("text", text.trim());
      if (imageFile) {
        const opt = await optimizeImage(imageFile);
        fd.append("image", opt);
      }
      const res = await fetch("/api/log/smart", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
        if (j.error === "rate_limited") {
          const min = Math.ceil((j.retryAfterSec ?? 300) / 60);
          setAiCooldown(true);
          setError(locale === "th" ? `AI พร้อมใช้อีกครั้งใน ${min} นาที` : `AI available in ${min} min`);
        } else {
          setError(j.error ?? "error");
        }
        return;
      }
      const s = (await res.json()) as AiSuggestion;
      setSuggestion(s);
      setMoodId(s.suggestedMoodId);
      setTags(s.tags);
    } catch (e) {
      console.error("[SmartLog] fetch error:", e);
      setError("error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      let imageKey = suggestion?.imageKey ?? null;
      if (!imageKey && imageFile) {
        const fd = new FormData();
        const opt = await optimizeImage(imageFile);
        fd.append("image", opt);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (upRes.ok) {
          const upData = (await upRes.json()) as { imageKey: string };
          imageKey = upData.imageKey;
        }
      }
      const res = await fetch("/api/log/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodTypeId: moodId,
          note: text.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          sentiment: suggestion?.sentiment ?? null,
          imageKey,
          aiSummary: suggestion?.aiSummary ?? null,
          aiSource: suggestion?.aiSource ?? "manual",
          ...(presetDate ? { date: presetDate } : {}),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
        if (j.error === "rate_limited") {
          const min = Math.ceil((j.retryAfterSec ?? 300) / 60);
          setError(locale === "th" ? `ลองใหม่ใน ${min} นาที` : `Try again in ${min} min`);
        } else {
          setError(j.error ?? "error");
        }
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 fade-in" style={{ background: "#FEFEFE" }}>
      <div
        className="flex flex-col h-full mx-auto w-full max-w-lg"
        style={{ padding: "0 20px env(safe-area-inset-bottom)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between py-3.5">
          <button onClick={onClose} className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
            {locale === "th" ? "บันทึกใหม่" : "New entry"}
          </span>
          <button
            onClick={handleSave}
            disabled={busy || analyzing}
            style={{
              background: "transparent", border: "none",
              fontWeight: 700, color: "#A673F1", fontSize: 15,
              opacity: busy || analyzing ? 0.4 : 1,
            }}
          >
            {locale === "th" ? "บันทึก" : "Save"}
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 100 }}>

          {/* ── HERO CARD ── */}
          <div
            style={{
              background: selectedMood
                ? `linear-gradient(135deg, ${selectedMood.color} 0%, ${selectedMood.color}CC 100%)`
                : "linear-gradient(135deg, #FCA45B 0%, #FEAD8D 100%)",
              borderRadius: 28,
              padding: "20px 20px 16px",
              marginBottom: 20,
              position: "relative",
            }}
          >
            {/* Date */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 0.4 }}>
                {locale === "th" ? "รู้สึก" : "FEELING"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                {dateFull} · {timeLabel}
              </div>
            </div>

            {/* Mood name + icon */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                  {selectedMood ? selectedMood.label : "Neutral"}
                </div>
                {selectedMood?.labelTh && (
                  <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                    {selectedMood.labelTh}
                  </div>
                )}
              </div>
              {selectedMood && (
                <img
                  src={iconSrc(selectedMood)}
                  alt=""
                  width={72}
                  height={72}
                  style={{ flexShrink: 0, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
                />
              )}
            </div>

            {/* Change mood */}
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 0.4, marginBottom: 8 }}>
              {locale === "th" ? "เปลี่ยนอารมณ์" : "CHANGE MOOD"}
            </div>
            <div style={{ position: "relative" }}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 48 }}>
                {allMoods.map((m) => {
                  const active = m.id === moodId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMoodId(m.id)}
                      className="shrink-0 flex flex-col items-center gap-1 transition active:scale-95"
                      style={{
                        width: 64, padding: "8px 0 6px",
                        borderRadius: 14,
                        background: active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)",
                        border: active ? "2px solid rgba(255,255,255,0.8)" : "2px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      <img src={iconSrc(m)} alt="" width={28} height={28} style={{ pointerEvents: "none" }} />
                      <span style={{ fontSize: 14, fontWeight: active ? 800 : 600, color: "#fff" }}>
                        {locale === "th" && m.labelTh ? m.labelTh : m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Scroll hint chevron */}
              <div style={{
                position: "absolute", right: -16, top: 0, bottom: 0,
                display: "flex", alignItems: "center",
                pointerEvents: "none",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── NOTE ── */}
          <div className="mb-5">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.4 }}>
                {locale === "th" ? "บันทึก" : "NOTE"}
              </span>
              <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
                {locale === "th" ? "ไม่บังคับ" : "Optional"}
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (suggestion) setSuggestion(null);
              }}
              placeholder={locale === "th" ? "วันนี้เป็นยังไงบ้าง..." : "What made you feel this way?"}
              rows={3}
              className="w-full resize-none"
              style={{
                background: "#fff",
                color: "var(--ink)",
                borderRadius: 18,
                border: "1.5px solid var(--hairline)",
                padding: "14px 16px",
                fontSize: 15,
                lineHeight: 1.5,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mb-4">
              <img src={imagePreview} alt="" className="w-full max-h-40 object-cover" style={{ borderRadius: 16 }} />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 icon-btn"
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.5)", color: "#fff" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Suggest tags with AI ── */}
          {!suggestion && !analyzing && (
            <button
              onClick={handleAnalyze}
              disabled={!hasInput || aiCooldown}
              className="w-full flex items-center justify-center gap-2 transition active:scale-[0.98] mb-5"
              style={{
                height: 44,
                background: "transparent",
                color: "#A673F1",
                border: "1.5px solid #E6DBF7",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 14,
                opacity: !hasInput || aiCooldown ? 0.4 : 1,
                position: "relative",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#A673F1" />
              </svg>
              {analyzing
                ? (locale === "th" ? "กำลังวิเคราะห์..." : "Analyzing...")
                : (locale === "th" ? "แนะนำ tags ด้วย AI" : "Suggest tags with AI")}
              {tier !== "premium" && (
                <span style={{
                  position: "absolute", top: -6, right: -4,
                  background: "#0A0A0A", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  padding: "2px 6px", borderRadius: 5,
                  letterSpacing: "0.3px", lineHeight: 1.3,
                }}>
                  PRO
                </span>
              )}
            </button>
          )}

          {/* AI analyzing state */}
          {analyzing && (
            <div className="fade-in mb-5" style={{
              padding: "14px 16px", borderRadius: 16,
              background: "#F4EBFE", border: "1px solid #E6DBF7",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div className="pulse" style={{
                width: 24, height: 24, borderRadius: 7,
                background: "#A673F1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor" /></svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#7A4DD0" }}>
                {locale === "th" ? "AI กำลังอ่านวันของคุณ..." : "AI is reading your day..."}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4" style={{
              padding: "12px 16px", borderRadius: 14,
              background: aiCooldown ? "#F4EEFB" : "#FEF0F0",
              border: aiCooldown ? "1px solid #E6DBF7" : "1px solid #F5D0D0",
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: aiCooldown ? "#7A4DD0" : "#D14343" }}>
                {aiCooldown ? error : (t(`err.${error}` as never) || (locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again."))}
              </p>
            </div>
          )}

          {/* ── TAGS ── */}
          <div className="mb-5">
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.4, marginBottom: 10 }}>
              TAGS
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5"
                  style={{
                    background: "#F4F2F7",
                    padding: "7px 12px",
                    borderRadius: 100,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  <span>🏷️</span>
                  {tag}
                  <button
                    onClick={() => setTags((p) => p.filter((_, j) => j !== i))}
                    style={{ color: "var(--ink-3)", display: "flex", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ))}
              {/* + Add tag input */}
              <form
                onSubmit={(e) => { e.preventDefault(); addTag(); }}
                className="flex items-center"
              >
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder={locale === "th" ? "+ เพิ่ม" : "+ Add"}
                  style={{
                    width: tagInput ? 120 : 70,
                    padding: "7px 12px",
                    borderRadius: 100,
                    border: "1.5px dashed var(--hairline-2)",
                    background: "transparent",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--primary)",
                    outline: "none",
                    transition: "width 0.2s",
                    fontFamily: "inherit",
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                />
              </form>
            </div>
          </div>

          {/* Pro teaser */}
          {!suggestion && tier !== "premium" && (
            <a
              href="/pricing"
              style={{
                display: "block", textDecoration: "none", marginBottom: 16,
                background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 100%)",
                borderRadius: 18, padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "#A673F1", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" /></svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#A673F1", letterSpacing: 0.4 }}>PRO</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 6 }}>
                {locale === "th"
                  ? "AI อ่านสิ่งที่คุณเขียน แล้วสรุปอารมณ์ แท็ก และ insight ให้อัตโนมัติ"
                  : "AI reads what you write and extracts mood, tags, and insights automatically"}
              </p>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1" }}>
                {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
              </span>
            </a>
          )}
        </div>

        {/* ── Fixed bottom bar ── */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "12px 20px calc(12px + env(safe-area-inset-bottom))",
          background: "linear-gradient(transparent, #FEFEFE 20%)",
        }}>
          <div className="mx-auto max-w-lg flex items-center gap-3">
            <VoiceButton onTranscript={(s) => setText((p) => (p ? p + " " : "") + s)} />
            <label
              className="icon-btn"
              style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                cursor: tier === "premium" ? "pointer" : "default",
                opacity: tier === "premium" ? 1 : 0.45,
                position: "relative",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tier !== "premium" && (
                <span style={{
                  position: "absolute", top: -4, right: -6,
                  background: "#0A0A0A", color: "#fff",
                  fontSize: 8, fontWeight: 800,
                  padding: "1px 4px", borderRadius: 4,
                  letterSpacing: "0.3px", lineHeight: 1.3,
                }}>PRO</span>
              )}
              {tier === "premium" && (
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                  }}
                />
              )}
            </label>
            <button
              onClick={handleSave}
              disabled={busy || analyzing}
              className="flex-1 flex items-center justify-center gap-2"
              style={{
                height: 52,
                background: "#0A0A0A", color: "#fff",
                border: "none", borderRadius: 100,
                fontWeight: 700, fontSize: 16,
                opacity: busy || analyzing ? 0.4 : 1,
              }}
            >
              {busy
                ? (locale === "th" ? "กำลังบันทึก..." : "Saving...")
                : suggestion
                  ? (locale === "th" ? "บันทึกพร้อม AI" : "Save with AI")
                  : (locale === "th" ? "บันทึก" : "Save entry")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
