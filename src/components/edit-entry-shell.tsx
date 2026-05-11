"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";
import { optimizeImage } from "@/lib/client-image";
import { VoiceButton } from "./voice-button";

interface EntryData {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags: string[] | null;
  sentiment: number | null;
  aiSummary: string | null;
  aiSource: string;
  imageKey: string | null;
  imageUrl: string | null;
  isPremium: boolean;
  date: string;
  createdAt: string | number;
}

interface AiSuggestion {
  suggestedMoodId: string;
  sentiment: number | null;
  tags: string[];
  imageKey: string | null;
  aiSource: string;
  aiSummary: string | null;
}

export function EditEntryShell({ id, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: { id: string; pack?: string; iconFormat?: string }) {
  const locale = useLocale();
  const t = useTranslations("editEntry");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [moodId, setMoodId] = useState("neutral");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [sentiment, setSentiment] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string>("manual");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiCooldown, setAiCooldown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [originalImageKey, setOriginalImageKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showToast(msg: string) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetch(`/api/log/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data as EntryData | null)
      .then((data) => {
        if (!data) return;
        setMoodId(data.moodTypeId);
        setNote(data.note ?? "");
        setTags(data.tags ?? []);
        setSentiment(data.sentiment);
        setAiSummary(data.aiSummary);
        setAiSource(data.aiSource);
        setImageKey(data.imageKey);
        setOriginalImageKey(data.imageKey);
        setImageUrl(data.imageUrl);
        setIsPremium(data.isPremium);
        const d = new Date(data.createdAt);
        setDateVal(d.toISOString().slice(0, 10));
        setTimeVal(d.toISOString().slice(11, 16));
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReanalyze() {
    if (!note.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("text", note.trim());
      if (imageFile) {
        const opt = await optimizeImage(imageFile);
        fd.append("image", opt);
      }
      const res = await fetch("/api/log/smart", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number; imageKey?: string };
        if (j.error === "rate_limited") {
          setAiCooldown(true);
          if (isPremium && j.retryAfterSec) {
            const min = Math.ceil(j.retryAfterSec / 60);
            setError(t("aiCooldown", { min }));
          } else {
            setError(t("aiLimitReached"));
          }
        } else {
          setError(t("errGeneric"));
        }
        return;
      }
      const s = (await res.json()) as AiSuggestion;
      setSuggestion(s);
      setMoodId(s.suggestedMoodId);
      setSentiment(s.sentiment);
      setAiSource(s.aiSource);
      if (s.aiSummary) setAiSummary(s.aiSummary);
      if (s.imageKey) {
        setImageKey(s.imageKey);
        setImageFile(null);
        setImagePreview(null);
      }
    } catch {
      setError(t("errGeneric"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    const selectedDt = new Date(`${dateVal}T${timeVal}:00`);
    if (selectedDt > new Date()) {
      showToast(locale === "th" ? "ไม่สามารถบันทึกเวลาในอนาคตได้" : "Cannot save a future date or time");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let finalImageKey = imageKey;
      if (imageFile) {
        const fd = new FormData();
        const opt = await optimizeImage(imageFile);
        fd.append("image", opt);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!upRes.ok) {
          setError(t("errGeneric"));
          return;
        }
        const upData = (await upRes.json()) as { imageKey: string };
        finalImageKey = upData.imageKey;
      }

      const createdAt = `${dateVal}T${timeVal}:00.000Z`;
      const res = await fetch(`/api/log/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodTypeId: moodId,
          note: note.trim() || null,
          tags,
          sentiment,
          imageKey: finalImageKey,
          aiSummary,
          aiSource,
          date: dateVal,
          createdAt,
        }),
      });
      if (!res.ok) {
        setError(t("errGeneric"));
        return;
      }
      router.replace(`/entry/${id}` as "/");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/log/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.replace("/" as "/");
      } else {
        setError(t("errGeneric"));
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handleAddTag() {
    const val = tagInput.trim();
    if (!val || tags.length >= 12 || tags.includes(val)) return;
    setTags([...tags, val]);
    setTagInput("");
  }

  function handleDeleteImage() {
    setImageKey(null);
    setImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
  }

  function handleReplaceImage(file: File) {
    setImageFile(file);
    setImageKey(null);
    setImageUrl(null);
    setImagePreview(URL.createObjectURL(file));
  }

  if (loading) return <LoadingSkeleton />;

  const mood = DEFAULT_MOODS.find((m) => m.id === moodId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const moodLabel = locale === "th" ? mood?.labelTh : mood?.label;
  const suggestedTags = suggestion?.tags.filter((st) => !tags.includes(st)) ?? [];
  const displayImageUrl = imagePreview ?? imageUrl;

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", fontSize: 15, fontWeight: 600, color: "var(--ink-2)" }}
        >
          {t("cancel")}
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
          {t("title")}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: "none", border: "none", fontSize: 15, fontWeight: 700, color: "#A673F1", opacity: saving ? 0.4 : 1 }}
        >
          {t("save")}
        </button>
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
          minHeight: 140,
          cursor: "pointer",
        }}
        onClick={() => setShowMoodPicker((v) => !v)}
      >
        {mood && (
          <img
            src={moodIconUrl(mood.id, pack, iconFormat)}
            alt=""
            width={120}
            height={120}
            style={{ position: "absolute", right: 10, bottom: 10, opacity: 0.6, pointerEvents: "none" }}
          />
        )}
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.5px", marginBottom: 4 }}>
            {t("feeling")}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1, marginBottom: 8 }}>
            {moodLabel}
          </div>
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 100,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("tapToChange")}
          </span>
        </div>

        {showMoodPicker && (
          <div className="flex flex-wrap gap-2 mt-4" style={{ position: "relative" }}>
            {DEFAULT_MOODS.map((m) => {
              const active = m.id === moodId;
              return (
                <button
                  key={m.id}
                  onClick={(e) => { e.stopPropagation(); setMoodId(m.id); }}
                  className="flex flex-col items-center gap-0.5 transition active:scale-95"
                  style={{
                    width: 64,
                    padding: "6px 0",
                    borderRadius: 14,
                    background: active ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)",
                    border: "none",
                    color: "var(--ink)",
                  }}
                >
                  <img src={moodIconUrl(m.id, pack, iconFormat)} alt="" width={28} height={28} />
                  <span style={{ fontSize: 11, fontWeight: active ? 800 : 600 }}>
                    {locale === "th" ? m.labelTh : m.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Your Note ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px" }}>
            {t("yourNote")}
          </div>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {note.length} {t("chars")}
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (suggestion) setSuggestion(null);
          }}
          rows={4}
          className="w-full resize-none"
          style={{
            background: "#FAF7FE",
            color: "var(--ink)",
            borderRadius: 16,
            border: "1.5px solid #E6DBF7",
            padding: "12px 14px",
            fontSize: 15,
            lineHeight: 1.5,
            outline: "none",
          }}
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleReanalyze}
            disabled={!note.trim() || analyzing || aiCooldown}
            className="flex-1 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            style={{
              height: 42,
              background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)",
              border: "none",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 13,
              color: "#7A4DD0",
              opacity: !note.trim() || analyzing || aiCooldown ? 0.4 : 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {analyzing ? t("reanalyzing") : t("reanalyze")}
          </button>
          <VoiceButton onTranscript={(s) => setNote((p) => (p ? p + " " : "") + s)} />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4" style={{ padding: "10px 14px", borderRadius: 12, background: "#F4EEFB", border: "1px solid #E6DBF7" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#7A4DD0" }}>{error}</p>
        </div>
      )}

      {/* ── Tags ── */}
      <div className="mb-5">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px", marginBottom: 8 }}>
          {t("tags")}
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="flex items-center gap-1"
              style={{
                background: "#fff",
                border: "1.5px solid #F2F0F5",
                padding: "6px 12px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              {tag}
              <button
                onClick={() => setTags(tags.filter((_, j) => j !== i))}
                style={{ color: "var(--ink-3)", display: "flex", background: "none", border: "none", padding: 0 }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
          {tags.length < 12 && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddTag(); }}
              className="flex items-center gap-1"
            >
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t("addTagPlaceholder")}
                style={{
                  width: 100,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#A673F1",
                }}
              />
            </form>
          )}
        </div>
      </div>

      {/* ── Suggested Tags ── */}
      {suggestedTags.length > 0 && (
        <div className="mb-5 fade-in">
          <div className="flex items-center gap-1.5 mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="#B89AE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#B89AE8", letterSpacing: "0.3px" }}>
              {t("suggestedTags")}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((st, i) => (
              <button
                key={i}
                onClick={() => { if (tags.length < 12) setTags([...tags, st]); }}
                style={{
                  background: "none",
                  border: "1.5px dashed #D4BEE4",
                  padding: "5px 12px",
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7A4DD0",
                }}
              >
                + {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Moment (photo) ── */}
      <div className="mb-5">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px", marginBottom: 8 }}>
          {t("moment")}
        </div>
        {displayImageUrl ? (
          <div style={{ position: "relative" }}>
            <img
              src={displayImageUrl}
              alt=""
              className="w-full"
              style={{ borderRadius: 22, maxHeight: 300, objectFit: "cover" }}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              {isPremium && (
                <label
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("replacePhoto")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleReplaceImage(f);
                    }}
                  />
                </label>
              )}
              <button
                onClick={handleDeleteImage}
                style={{
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: "none",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : isPremium ? (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 80,
              borderRadius: 16,
              border: "1.5px dashed #E6DBF7",
              background: "#FAF7FE",
              color: "#A673F1",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("addPhoto")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleReplaceImage(f);
              }}
            />
          </label>
        ) : null}
      </div>

      {/* ── Date & Time ── */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px", marginBottom: 6 }}>
            {t("date")}
          </div>
          <input
            type="date"
            value={dateVal}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDateVal(e.target.value)}
            style={{
              width: "100%",
              background: "#FAF7FE",
              border: "1.5px solid #E6DBF7",
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              outline: "none",
            }}
          />
        </div>
        <div className="flex-1">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A673F1", letterSpacing: "0.5px", marginBottom: 6 }}>
            {t("time")}
          </div>
          <input
            type="time"
            value={timeVal}
            onChange={(e) => setTimeVal(e.target.value)}
            style={{
              width: "100%",
              background: "#FAF7FE",
              border: "1.5px solid #E6DBF7",
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Delete Entry ── */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full flex items-center justify-center gap-2 mb-5 transition active:scale-[0.98]"
        style={{
          height: 48,
          background: "#FEF2F2",
          border: "none",
          borderRadius: 14,
          fontWeight: 700,
          fontSize: 14,
          color: "#DC2626",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("deleteEntry")}
      </button>

      {/* ── Bottom Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center gap-3 px-5 pb-6 pt-3"
        style={{ background: "linear-gradient(transparent, var(--bg) 30%)", zIndex: 30 }}
      >
        <div className="mx-auto w-full max-w-[768px] flex items-center gap-3">
          <button
            onClick={() => router.back()}
            style={{
              height: 48,
              padding: "0 20px",
              background: "#fff",
              border: "1.5px solid #F2F0F5",
              borderRadius: 100,
              fontWeight: 700,
              fontSize: 14,
              color: "var(--ink)",
            }}
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 transition active:scale-[0.97]"
            style={{
              height: 48,
              background: "#0A0A0A",
              color: "#fff",
              border: "none",
              borderRadius: 100,
              fontWeight: 700,
              fontSize: 14,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? t("saving") : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("saveChanges")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fade-in"
          style={{
            position: "fixed",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            background: "var(--ink)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {/* ── Delete Confirm Overlay ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center fade-in" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "min(340px, 90vw)", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
              {t("deleteConfirmTitle")}
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 20 }}>
              {t("deleteConfirmBody")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
                style={{
                  height: 44,
                  background: "#F4F2F7",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--ink)",
                }}
              >
                {t("deleteCancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
                style={{
                  height: 44,
                  background: "#DC2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? t("deleting") : t("deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="pt-16 space-y-4 fade-in">
      <div style={{ height: 140, borderRadius: 28, background: "var(--surface-2)", opacity: 0.6 }} />
      <div style={{ height: 120, borderRadius: 16, background: "var(--surface-2)", opacity: 0.5 }} />
      <div style={{ height: 60, borderRadius: 16, background: "var(--surface-2)", opacity: 0.4 }} />
      <div style={{ height: 80, borderRadius: 16, background: "var(--surface-2)", opacity: 0.35 }} />
    </div>
  );
}
