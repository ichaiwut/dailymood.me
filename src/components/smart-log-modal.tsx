"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { optimizeImage } from "@/lib/client-image";
import { VoiceButton } from "./voice-button";

type Tier = "guest" | "free" | "premium";

interface AiSuggestion {
  suggestedMoodId: string;
  sentiment: number | null;
  tags: string[];
  imageKey: string | null;
  aiSource: "manual" | "nlp" | "vision" | "nlp+vision";
}

interface Props {
  tier: Tier;
  onClose: () => void;
  onSaved: () => void;
  pack?: string;
  preSelectedMoodId?: string;
}

export function SmartLogModal({
  tier,
  onClose,
  onSaved,
  pack = DEFAULT_MOOD_PACK,
  preSelectedMoodId,
}: Props) {
  const t = useTranslations("smart");
  const locale = useLocale();
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [moodId, setMoodId] = useState<string>(preSelectedMoodId ?? "neutral");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiCooldown, setAiCooldown] = useState(false);

  const selectedMood = DEFAULT_MOODS.find((m) => m.id === moodId);
  const hasInput = text.trim().length > 0 || !!imageFile;

  const now = new Date();
  const dateLabel = now.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    weekday: "long",
  });
  const timeLabel = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

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
          setError(locale === "th" ? `AI พร้อมใช้อีกครั้งใน ${min} นาที — บันทึกธรรมดาได้เลย` : `AI available in ${min} min — you can still save normally`);
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
      const res = await fetch("/api/log/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodTypeId: moodId,
          note: text.trim() || undefined,
          tags: suggestion ? tags : undefined,
          sentiment: suggestion?.sentiment ?? null,
          imageKey: suggestion?.imageKey ?? null,
          aiSource: suggestion?.aiSource ?? "manual",
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
        if (j.error === "rate_limited") {
          const min = Math.ceil((j.retryAfterSec ?? 300) / 60);
          setError(locale === "th" ? `โพสได้อีกครั้งใน ${min} นาที` : `Try again in ${min} min`);
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

  function handleDone() {
    handleSave();
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
            onClick={handleDone}
            disabled={busy || analyzing}
            style={{
              background: "transparent",
              border: "none",
              fontWeight: 700,
              color: "#A673F1",
              fontSize: 15,
              opacity: busy || analyzing ? 0.4 : 1,
            }}
          >
            Done
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>
          {/* Date + heading */}
          <div className="mt-1 mb-4">
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>
              {dateLabel} · {timeLabel}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 4, lineHeight: 1.2, color: "var(--ink)", whiteSpace: "pre-line" }}>
              {locale === "th" ? "วันนี้เป็นยังไง?" : "How was\nyour day?"}
            </h1>
          </div>

          {/* ── Text area ── */}
          <div className="mb-4">
            <div className="flex gap-2 items-end">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (suggestion) setSuggestion(null);
                }}
                placeholder={t("textPlaceholder")}
                rows={4}
                className="flex-1 resize-none text-base"
                style={{
                  background: "#FAF7FE",
                  color: "var(--ink)",
                  borderRadius: 20,
                  border: "1.5px solid #E6DBF7",
                  padding: "14px 16px",
                  fontSize: 16,
                  lineHeight: 1.5,
                  outline: "none",
                  WebkitAppearance: "none",
                }}
              />
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <VoiceButton onTranscript={(s) => setText((p) => (p ? p + " " : "") + s)} />
              <label className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12, cursor: "pointer" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setImageFile(f);
                      setImagePreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
            </div>
            {imagePreview && (
              <div className="relative mt-3">
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
          </div>

          {/* ── Analyze with AI button ── */}
          {!suggestion && (
            <button
              onClick={handleAnalyze}
              disabled={!hasInput || analyzing || aiCooldown}
              className="w-full flex items-center justify-center gap-2 mb-4 transition active:scale-[0.98]"
              style={{
                height: 48,
                background: "#A673F1",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                opacity: !hasInput || analyzing || aiCooldown ? 0.4 : 1,
              }}
            >
              <SparkleIcon />
              {analyzing
                ? (locale === "th" ? "กำลังวิเคราะห์..." : "Analyzing...")
                : aiCooldown
                  ? (locale === "th" ? "AI ยังไม่พร้อม" : "AI on cooldown")
                  : (locale === "th" ? "วิเคราะห์ด้วย AI" : "Analyze with AI")}
            </button>
          )}

          {/* ── Info / Error ── */}
          {error && (
            <div
              className="mb-4"
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                background: aiCooldown ? "#F4EEFB" : "#FEF0F0",
                border: aiCooldown ? "1px solid #E6DBF7" : "1px solid #F5D0D0",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: aiCooldown ? "#7A4DD0" : "#D14343" }}>
                {aiCooldown ? error : (t(`err.${error}` as never) || (locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again."))}
              </p>
            </div>
          )}

          {/* ── AI blocked — mood picker + manual save ── */}
          {aiCooldown && !suggestion && (
            <div className="mb-4">
              <div style={{ fontSize: 10, color: "#8C7BA9", fontWeight: 700, marginBottom: 6, letterSpacing: "0.4px" }}>
                {locale === "th" ? "เลือกอารมณ์" : "PICK A MOOD"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_MOODS.map((m) => {
                  const active = m.id === moodId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMoodId(m.id)}
                      className="flex items-center gap-1 transition active:scale-95"
                      style={{
                        background: active ? m.color : "var(--surface-2)",
                        color: active ? "#fff" : "var(--ink-2)",
                        padding: "5px 10px",
                        borderRadius: 100,
                        fontSize: 12,
                        fontWeight: 700,
                        border: "none",
                      }}
                    >
                      <img src={m.iconUrl} alt="" width={16} height={16} />
                      {locale === "th" ? m.labelTh : m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── AI Analysis (analyzing state) ── */}
          {analyzing && (
            <div
              className="fade-in"
              style={{
                padding: "18px 16px",
                borderRadius: 22,
                background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="pulse"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#A673F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.5px" }}>
                  {locale === "th" ? "AI กำลังอ่านวันของคุณ..." : "AI IS READING YOUR DAY..."}
                </span>
              </div>
            </div>
          )}

          {/* ── AI Results ── */}
          {suggestion && !analyzing && (
            <div
              className="fade-in"
              style={{
                padding: "18px 16px",
                borderRadius: 22,
                background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#A673F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.5px" }}>
                  {locale === "th" ? "AI อ่านวันของคุณแล้ว" : "AI READ YOUR DAY"}
                </span>
              </div>

              {/* Detected mood pills */}
              <div className="mb-4">
                <div style={{ fontSize: 11, color: "#8C7BA9", fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px" }}>
                  DETECTED MOOD
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_MOODS.filter((m) => m.id === moodId).map((m) => (
                    <span
                      key={m.id}
                      className="pop flex items-center gap-1.5"
                      style={{
                        background: m.color,
                        color: "#fff",
                        padding: "7px 14px",
                        borderRadius: 100,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      <img src={m.iconUrl} alt="" width={18} height={18} />
                      {locale === "th" ? m.labelTh : m.label}
                      {suggestion.sentiment !== null && (
                        <span style={{ opacity: 0.85, fontSize: 12 }}>
                          {Math.round(Math.abs(suggestion.sentiment) * 100)}%
                        </span>
                      )}
                    </span>
                  ))}
                  {DEFAULT_MOODS.filter((m) => m.id !== moodId)
                    .slice(0, 1)
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMoodId(m.id)}
                        className="flex items-center gap-1.5 transition active:scale-95"
                        style={{
                          background: "rgba(255,255,255,0.7)",
                          border: "1.5px solid #E6DBF7",
                          padding: "6px 12px",
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ink-2)",
                        }}
                      >
                        <img src={m.iconUrl} alt="" width={16} height={16} />
                        {locale === "th" ? m.labelTh : m.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#8C7BA9", fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px" }}>
                    FOUND IN YOUR NOTE
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="pop flex items-center gap-1.5"
                        style={{
                          background: "#fff",
                          padding: "7px 12px",
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ink)",
                          animationDelay: `${i * 60}ms`,
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => setTags((p) => p.filter((_, j) => j !== i))}
                          style={{ color: "var(--ink-3)", display: "flex" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    <span
                      style={{
                        background: "rgba(255,255,255,0.5)",
                        padding: "7px 12px",
                        borderRadius: 100,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#A673F1",
                      }}
                    >
                      + add tag
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Fixed bottom CTA ── */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 20px calc(12px + env(safe-area-inset-bottom))",
            background: "linear-gradient(transparent, #FEFEFE 20%)",
          }}
        >
          <div className="mx-auto max-w-lg">
            <button
              onClick={handleSave}
              disabled={!hasInput || busy || analyzing}
              className="w-full flex items-center justify-center gap-2"
              style={{
                height: 56,
                background: "#FCA45B",
                color: "#fff",
                border: "none",
                borderRadius: 30,
                fontWeight: 700,
                fontSize: 17,
                boxShadow: "0 10px 24px rgba(252,164,91,0.35)",
                opacity: !hasInput || busy || analyzing ? 0.4 : 1,
              }}
            >
              {busy
                ? t("saving")
                : suggestion
                  ? (locale === "th" ? "บันทึกพร้อม AI tags" : "Save with AI tags")
                  : (locale === "th" ? "บันทึก" : "Save entry")}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor" />
    </svg>
  );
}
