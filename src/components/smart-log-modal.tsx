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
  const [error, setError] = useState<string | null>(null);

  const selectedMood = DEFAULT_MOODS.find((m) => m.id === moodId);

  async function handleAnalyze() {
    if (!text.trim() && !imageFile) return;
    setBusy(true);
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
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? "error");
        return;
      }
      const s = (await res.json()) as AiSuggestion;
      setSuggestion(s);
      setMoodId(s.suggestedMoodId);
      setTags(s.tags);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await fetch("/api/log/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodTypeId: moodId,
          note: text.trim() || undefined,
          tags,
          sentiment: suggestion?.sentiment ?? null,
          imageKey: suggestion?.imageKey ?? null,
          aiSource: suggestion?.aiSource ?? "manual",
        }),
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  function pickImage(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleQuickSave() {
    setBusy(true);
    try {
      await fetch("/api/log/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodTypeId: moodId,
          note: text.trim() || undefined,
          aiSource: "manual",
        }),
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  const hasInput = text.trim().length > 0 || !!imageFile;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto pop"
        style={{
          background: "#FEFEFE",
          borderRadius: "28px 28px 0 0",
          boxShadow: "var(--shadow-lift)",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={onClose}
            className="icon-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
            {t("title")}
          </span>
          <button
            onClick={suggestion ? handleConfirm : hasInput ? handleAnalyze : handleQuickSave}
            disabled={busy}
            style={{
              background: "transparent",
              border: "none",
              fontWeight: 700,
              color: "#A673F1",
              fontSize: 15,
              opacity: busy ? 0.5 : 1,
            }}
          >
            Done
          </button>
        </div>

        {!suggestion ? (
          <div className="flex flex-col" style={{ minHeight: 400 }}>
            {/* Date + title */}
            <div className="mt-3">
              <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>
                {new Date().toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
                  weekday: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, lineHeight: 1.2, color: "var(--ink)" }}>
                How was<br />your day?
              </div>
            </div>

            {/* Mood picker row */}
            <div className="mt-5 mb-4">
              <div className="grid grid-cols-7 gap-2">
                {DEFAULT_MOODS.map((m) => {
                  const active = moodId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMoodId(m.id)}
                      aria-label={locale === "th" ? m.labelTh : m.label}
                      aria-pressed={active}
                      className="grid place-items-center transition-transform p-[12%]"
                      style={{
                        aspectRatio: "1",
                        borderRadius: 16,
                        background: active ? m.color : "var(--surface-2)",
                        transform: active ? "scale(1.08)" : "scale(1)",
                        boxShadow: active
                          ? `0 0 0 3px #fff, 0 0 0 5px ${m.color}`
                          : "none",
                      }}
                    >
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{m.emoji}</span>
                    </button>
                  );
                })}
              </div>
              {selectedMood && (
                <p className="text-center mt-2 text-sm font-bold" style={{ color: "var(--ink)" }}>
                  {locale === "th" ? selectedMood.labelTh : selectedMood.label}
                </p>
              )}
            </div>

            {/* Note input */}
            <div className="mb-3">
              <div className="flex gap-2 items-start">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("textPlaceholder")}
                  rows={4}
                  className="flex-1 resize-none text-base focus:outline-none"
                  style={{
                    background: "#FAF7FE",
                    color: "var(--ink)",
                    borderRadius: 22,
                    border: "2px solid #E6DBF7",
                    padding: "14px 16px",
                    fontSize: 17,
                    lineHeight: 1.5,
                  }}
                />
                <VoiceButton onTranscript={(s) => setText((p) => (p ? p + " " : "") + s)} />
              </div>
            </div>

            {/* Image upload (premium) */}
            {tier === "premium" && (
              <div className="mb-3">
                <label
                  className="text-sm font-medium mb-1 block"
                  style={{ color: "var(--ink-2)" }}
                >
                  {t("imageOptional")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])}
                  className="text-sm"
                  style={{ color: "var(--ink-2)" }}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt=""
                    className="mt-2 max-h-40"
                    style={{ borderRadius: 16 }}
                  />
                )}
              </div>
            )}

            {tier === "free" && (
              <p className="mb-3 text-sm" style={{ color: "var(--ink-3)" }}>
                {t("freeNotice")}
              </p>
            )}

            {error && (
              <p className="mb-3 text-sm font-medium" style={{ color: "#D14343" }}>
                {t(`err.${error}` as never) || error}
              </p>
            )}

            <div className="mt-auto" />

            {/* Action buttons */}
            <div className="flex gap-2.5 mt-4">
              {hasInput ? (
                <button
                  onClick={handleAnalyze}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2"
                  style={{
                    height: 56,
                    background: "#FCA45B",
                    color: "#fff",
                    border: "none",
                    borderRadius: 30,
                    fontWeight: 700,
                    fontSize: 17,
                    boxShadow: "0 10px 24px rgba(252,164,91,0.4)",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  <SparkleIcon />
                  {busy ? t("analyzing") : "Save with AI tags"}
                </button>
              ) : (
                <button
                  onClick={handleQuickSave}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2"
                  style={{
                    height: 56,
                    background: "#FCA45B",
                    color: "#fff",
                    border: "none",
                    borderRadius: 30,
                    fontWeight: 700,
                    fontSize: 17,
                    boxShadow: "0 10px 24px rgba(252,164,91,0.4)",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy ? t("saving") : t("confirm")}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── AI suggestion review step ── */
          <div className="flex flex-col" style={{ minHeight: 400 }}>
            {/* AI detection section */}
            <div
              className="mt-3 mb-4"
              style={{
                padding: 16,
                borderRadius: 20,
                background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="pulse"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
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
                <span style={{ fontSize: 12, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.4px" }}>
                  AI DETECTED
                </span>
              </div>

              {/* Detected mood */}
              <div className="mb-3">
                <div style={{ fontSize: 11, color: "#8C7BA9", fontWeight: 700, marginBottom: 6, letterSpacing: "0.4px" }}>
                  DETECTED MOOD
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {DEFAULT_MOODS.map((m) => {
                    const active = moodId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMoodId(m.id)}
                        className="grid place-items-center transition-transform p-[12%]"
                        style={{
                          aspectRatio: "1",
                          borderRadius: 14,
                          background: active ? m.color : "rgba(255,255,255,0.7)",
                          transform: active ? "scale(1.08)" : "scale(1)",
                          boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${m.color}` : "none",
                        }}
                      >
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{m.emoji}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedMood && (
                  <p className="text-center mt-2 text-sm font-bold" style={{ color: "var(--ink)" }}>
                    {locale === "th" ? selectedMood.labelTh : selectedMood.label}
                    {suggestion.sentiment !== null && (
                      <span style={{ color: "#8C8C8C", fontSize: 11, marginLeft: 6 }}>
                        {Math.round(Math.abs(suggestion.sentiment) * 100)}%
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#8C7BA9", fontWeight: 700, marginBottom: 6, letterSpacing: "0.4px" }}>
                    FOUND IN YOUR NOTE
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="pop flex items-center gap-1.5"
                        style={{
                          background: "#fff",
                          padding: "6px 12px",
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 700,
                          animationDelay: `${i * 60}ms`,
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => setTags((p) => p.filter((_, j) => j !== i))}
                          style={{ color: "var(--ink-3)", marginLeft: 2 }}
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
                        padding: "6px 12px",
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

            {imagePreview && (
              <img src={imagePreview} alt="" className="mb-4 max-h-40 w-full object-cover" style={{ borderRadius: 16 }} />
            )}

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setSuggestion(null)}
                className="icon-btn"
                style={{ width: "auto", padding: "0 16px", borderRadius: 30 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  height: 56,
                  background: "#FCA45B",
                  color: "#fff",
                  border: "none",
                  borderRadius: 30,
                  fontWeight: 700,
                  fontSize: 17,
                  boxShadow: "0 10px 24px rgba(252,164,91,0.4)",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? t("saving") : t("confirm")}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"
        fill="currentColor"
      />
    </svg>
  );
}
