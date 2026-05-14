"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  entryNumber?: number;
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
  const th = locale === "th";

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
  const [toast, setToast] = useState<string | null>(null);
  const [entryNumber, setEntryNumber] = useState<number | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const noteRef = useRef<HTMLTextAreaElement>(null);

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
        setImageUrl(data.imageUrl);
        setIsPremium(data.isPremium);
        setEntryNumber(data.entryNumber ?? null);
        const d = new Date(data.createdAt);
        setDateVal(d.toISOString().slice(0, 10));
        setTimeVal(d.toISOString().slice(11, 16));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReanalyze = useCallback(async () => {
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
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
        if (j.error === "rate_limited") {
          setAiCooldown(true);
          if (isPremium && j.retryAfterSec) {
            setError(t("aiCooldown", { min: Math.ceil(j.retryAfterSec / 60) }));
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
  }, [note, imageFile, isPremium, t]);

  const handleSave = useCallback(async () => {
    const selectedDt = new Date(`${dateVal}T${timeVal}:00`);
    if (selectedDt > new Date()) {
      showToast(t("futureDateError"));
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
        if (!upRes.ok) { setError(t("errGeneric")); return; }
        const upData = (await upRes.json()) as { imageKey: string };
        finalImageKey = upData.imageKey;
      }
      const createdAt = selectedDt.toISOString();
      const res = await fetch(`/api/log/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodTypeId: moodId, note: note.trim() || null, tags, sentiment,
          imageKey: finalImageKey, aiSummary, aiSource, date: dateVal, createdAt,
        }),
      });
      if (!res.ok) { setError(t("errGeneric")); return; }
      router.replace(`/entry/${id}` as const);
    } finally {
      setSaving(false);
    }
  }, [dateVal, timeVal, note, moodId, tags, sentiment, imageKey, imageFile, aiSummary, aiSource, id, t, router]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/log/${id}`, { method: "DELETE" });
      if (res.ok) { router.replace("/" as const); }
      else { setError(t("errGeneric")); }
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

  function handleBoldToggle() {
    const el = noteRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    if (s === e) return;
    const selected = note.slice(s, e);
    const isBoldSelected = selected.startsWith("**") && selected.endsWith("**") && selected.length > 4;
    let next: string;
    if (isBoldSelected) {
      next = note.slice(0, s) + selected.slice(2, -2) + note.slice(e);
    } else {
      next = note.slice(0, s) + `**${selected}**` + note.slice(e);
    }
    setNote(next);
    if (suggestion) setSuggestion(null);
    requestAnimationFrame(() => {
      el.focus();
      const newEnd = isBoldSelected ? e - 4 : e + 4;
      el.setSelectionRange(s, newEnd);
    });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "Escape") { e.preventDefault(); router.back(); }
      if (e.metaKey && e.key === "Enter") { e.preventDefault(); handleReanalyze(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, handleReanalyze, router]);

  if (loading) return <LoadingSkeleton />;

  const mood = DEFAULT_MOODS.find((m) => m.id === moodId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const moodLabel = th ? mood?.labelTh : mood?.label;
  const suggestedTags = suggestion?.tags.filter((st) => !tags.includes(st)) ?? [];
  const displayImageUrl = imagePreview ?? imageUrl;

  const entryDate = dateVal ? new Date(dateVal + "T12:00:00") : new Date();
  const weekday = entryDate.toLocaleDateString(th ? "th-TH" : "en-US", { weekday: "long" });
  const formattedDate = entryDate.toLocaleDateString(th ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  const timeLabel = timeVal || "00:00";

  return (
    <div className="fade-in" style={{ paddingBottom: 80 }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)", marginBottom: 6 }}>
          {t("editingEntry", { n: entryNumber ?? "–" })}
        </div>
        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
          {t("editingTitle", { weekday, date: formattedDate })}
        </h1>
      </div>

      <div className="grid-2col" style={{ alignItems: "start" }}>

        {/* ═══ LEFT COLUMN — Form ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Mood Picker ── */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>
              {t("feeling")}
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
              {DEFAULT_MOODS.map((m) => {
                const active = m.id === moodId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMoodId(m.id)}
                    aria-pressed={active}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      minWidth: 72,
                      padding: "12px 8px",
                      borderRadius: 16,
                      background: active ? moodColor : "var(--surface)",
                      border: active ? "none" : "1px solid var(--hairline)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <img src={moodIconUrl(m.id, pack, iconFormat)} alt="" width={32} height={32} />
                    <span style={{ fontSize: 14, fontWeight: active ? 800 : 600, color: "var(--ink)", whiteSpace: "nowrap" }}>
                      {th ? m.labelTh : m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Date / Time / Period ── */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>
              {t("dateTime")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 14, padding: "10px 14px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  type="date"
                  value={dateVal}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDateVal(e.target.value)}
                  style={{ flex: 1, background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "var(--ink)", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 14, padding: "10px 14px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  type="time"
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  style={{ flex: 1, background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "var(--ink)", outline: "none" }}
                />
              </div>
            </div>
          </div>

          {/* ── Note ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)" }}>
                {t("note")}
              </div>
              <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
                {note.length} / 500 {t("chars")}
              </span>
            </div>
            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (suggestion) setSuggestion(null);
              }}
              maxLength={500}
              rows={5}
              className="w-full resize-none"
              style={{
                background: "var(--surface)",
                color: "var(--ink)",
                borderRadius: 16,
                border: "1px solid var(--hairline)",
                padding: "14px 16px",
                fontSize: 15,
                lineHeight: 1.6,
                outline: "none",
              }}
            />
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <ToolbarBtn icon={<BoldIcon />} label={t("boldToggle")} onClick={handleBoldToggle} />
              <VoiceButton onTranscript={(s) => setNote((p) => (p ? p + " " : "") + s)} />
              {isPremium ? (
                <label style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--hairline)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>
                  <ImageIcon />
                  {t("image")}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceImage(f); }} />
                </label>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, background: "var(--surface-2)", fontSize: 14, fontWeight: 600, color: "var(--ink-3)", opacity: 0.6 }}>
                  <ImageIcon />
                  {t("image")}
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple)", marginLeft: 2 }}>PRO</span>
                </span>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={handleReanalyze}
                disabled={!note.trim() || analyzing || aiCooldown}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: analyzing ? "var(--surface-2)" : "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#7A4DD0",
                  cursor: "pointer",
                  opacity: !note.trim() || analyzing || aiCooldown ? 0.4 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                <SparkleIcon />
                {analyzing ? t("reanalyzing") : t("reanalyzeShort")}
              </button>
            </div>
          </div>

          {/* ── AI Suggestion Result ── */}
          {suggestion && (
            <div className="fade-in" style={{ padding: "16px 18px", borderRadius: 16, background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <SparkleIcon />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#7A4DD0" }}>{th ? "AI วิเคราะห์แล้ว" : "AI analysis complete"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: suggestion.tags.length > 0 ? 10 : 0 }}>
                {mood && <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={28} height={28} />}
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{moodLabel}</span>
                {suggestion.aiSummary && (
                  <span style={{ fontSize: 14, color: "var(--ink-2)", flex: 1 }}>
                    — {suggestion.aiSummary.replace(/\*\*(.*?)\*\*/g, "$1").slice(0, 80)}{(suggestion.aiSummary.length > 80 ? "..." : "")}
                  </span>
                )}
              </div>
              {suggestion.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {suggestion.tags.map((st, i) => (
                    <span key={i} style={{ padding: "4px 10px", borderRadius: 100, background: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                      #{st}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "#F4EEFB", border: "1px solid #E6DBF7" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#7A4DD0", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* ── Tags ── */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>
              {t("tags")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    padding: "8px 14px",
                    borderRadius: 100,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  # {tag}
                  <button
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    aria-label={th ? `ลบแท็ก ${tag}` : `Remove tag ${tag}`}
                    style={{ color: "var(--ink-3)", display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ))}
              {tags.length < 12 && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddTag(); }} style={{ display: "flex", alignItems: "center" }}>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder={t("addTag")}
                    style={{
                      width: 110,
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#A673F1",
                    }}
                  />
                </form>
              )}
            </div>

            {/* Suggested tags */}
            {suggestedTags.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginRight: 10 }}>
                  {t("suggested")}
                </span>
                <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {suggestedTags.map((st, i) => (
                    <button
                      key={i}
                      onClick={() => { if (tags.length < 12) setTags([...tags, st]); }}
                      style={{
                        background: "#FFF7ED",
                        border: "1.5px dashed #FDCB56",
                        padding: "6px 14px",
                        borderRadius: 100,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--ink)",
                        cursor: "pointer",
                      }}
                    >
                      + {st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Image ── */}
          {displayImageUrl && (
            <div style={{ position: "relative" }}>
              <img
                src={displayImageUrl}
                alt=""
                style={{ width: "100%", borderRadius: 16, maxHeight: 300, objectFit: "cover" }}
              />
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 8 }}>
                {isPremium ? (
                  <label style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14, fontWeight: 700, padding: "6px 12px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {t("replacePhoto")}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceImage(f); }} />
                  </label>
                ) : (
                  <span style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, padding: "6px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {t("replacePhoto")}
                    <span style={{ fontSize: 14, fontWeight: 800, marginLeft: 2 }}>PRO</span>
                  </span>
                )}
                <button
                  onClick={handleDeleteImage}
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT COLUMN — Sidebar ═══ */}
        <div className="edit-sidebar" style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 32 }}>

          {/* ── Live Preview ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)" }}>{t("livePreview")}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399" }} />
            </div>
            <div style={{
              borderRadius: 22,
              padding: "18px 20px 20px",
              background: moodColor,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(0,0,0,.35)", marginBottom: 16 }}>
                {weekday} · {timeLabel}
              </div>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                {mood && <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={72} height={72} style={{ margin: "0 auto 10px", display: "block" }} />}
                <div style={{ fontSize: 20, fontWeight: 800, color: "rgba(0,0,0,.5)" }}>{moodLabel}</div>
              </div>
              {tags.length > 0 && (
                <div style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "rgba(0,0,0,.35)" }}>
                  {tags.join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* ── AI Insight ── */}
          {aiSummary && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <SparkleIcon />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--purple)" }}>{t("aiInsightTitle")}</span>
              </div>
              <div
                style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink)" }}
                dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }}
              />
              <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)" }} />
                {t("aiInsightNote")}
              </div>
            </div>
          )}

          {/* ── Keyboard Shortcuts ── */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 12 }}>{t("shortcuts")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ShortcutRow label={t("shortcutSave")} keys={["⌘", "S"]} />
              <ShortcutRow label={t("shortcutCancel")} keys={["Esc"]} />
              <ShortcutRow label={t("shortcutAi")} keys={["⌘", "↵"]} />
            </div>
          </div>

          {/* ── Save / Cancel (desktop) ── */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              height: 48,
              background: "#0A0A0A",
              color: "#fff",
              border: "none",
              borderRadius: 100,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: saving ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {saving ? t("saving") : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t("saveChanges")}
              </>
            )}
          </button>
          <button
            onClick={() => router.back()}
            style={{
              width: "100%",
              height: 44,
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: 100,
              fontWeight: 700,
              fontSize: 14,
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            {t("cancel")}
          </button>

          {/* ── Danger Zone ── */}
          <div className="card" style={{ padding: 18, border: "1.5px solid #FCA5A5" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#DC2626", marginBottom: 6 }}>
              {t("dangerZone")}
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 12px" }}>
              {t("dangerZoneNote")}
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                background: "none",
                border: "1.5px solid #FCA5A5",
                fontSize: 14,
                fontWeight: 700,
                color: "#DC2626",
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              {t("deleteEntry")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Bar ── */}
      <div className="edit-bottom-bar">
        <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 768, margin: "0 auto" }}>
          <button
            onClick={() => router.back()}
            style={{ height: 48, padding: "0 20px", background: "#fff", border: "1.5px solid var(--hairline)", borderRadius: 100, fontWeight: 700, fontSize: 14, color: "var(--ink)" }}
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
            style={{ height: 48, background: "#0A0A0A", color: "#fff", border: "none", borderRadius: 100, fontWeight: 700, fontSize: 14, opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {saving ? t("saving") : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
            position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 60,
            background: "var(--ink)", color: "#fff", padding: "10px 20px", borderRadius: 100,
            fontSize: 14, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", whiteSpace: "nowrap",
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
                style={{ height: 44, background: "#F4F2F7", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "var(--ink)" }}
              >
                {t("deleteCancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
                style={{ height: 44, background: "#DC2626", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, opacity: deleting ? 0.6 : 1 }}
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

/* ─── Sub-components ─── */

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {keys.map((k, i) => (
          <kbd
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 28,
              height: 28,
              padding: "0 8px",
              borderRadius: 8,
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink-2)",
              fontFamily: "inherit",
            }}
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function ToolbarBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "7px 12px",
        borderRadius: 10,
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--ink-2)",
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function BoldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h8a4 4 0 010 8H6V4zM6 12h9a4 4 0 010 8H6V12z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="pt-8 fade-in">
      <div style={{ height: 20, width: 200, borderRadius: 8, background: "var(--surface-2)", opacity: 0.6, marginBottom: 8 }} />
      <div style={{ height: 32, width: 360, borderRadius: 8, background: "var(--surface-2)", opacity: 0.5, marginBottom: 24 }} />
      <div className="grid-2col" style={{ alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ height: 100, borderRadius: 16, background: "var(--surface-2)", opacity: 0.5 }} />
          <div style={{ height: 60, borderRadius: 14, background: "var(--surface-2)", opacity: 0.45 }} />
          <div style={{ height: 160, borderRadius: 16, background: "var(--surface-2)", opacity: 0.4 }} />
          <div style={{ height: 50, borderRadius: 14, background: "var(--surface-2)", opacity: 0.35 }} />
        </div>
        <div className="edit-sidebar" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ height: 200, borderRadius: 22, background: "var(--surface-2)", opacity: 0.5 }} />
          <div style={{ height: 120, borderRadius: 14, background: "var(--surface-2)", opacity: 0.4 }} />
          <div style={{ height: 100, borderRadius: 14, background: "var(--surface-2)", opacity: 0.35 }} />
        </div>
      </div>
    </div>
  );
}
