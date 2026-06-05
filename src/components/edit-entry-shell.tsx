"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";
import { optimizeImage } from "@/lib/client-image";
import { VoiceButton } from "./voice-button";
import { AiDisclaimer } from "./ai-disclaimer";
import { LocationSearch } from "./location-picker";
import { ActivityPicker } from "./activity-picker";
import { PASticker } from "./paper/pa-sticker";
import { trackMoodLog, trackEntryDelete } from "@/lib/analytics";

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
  activityId: string | null;
  location: string | null;
  locationLat: number | null;
  locationLng: number | null;
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

// shared eyebrow label inside the paper sheet
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "var(--w-ink-3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 };
// paper input field shell
const fieldShell: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, background: "#FBF7F0", border: "1.5px solid var(--w-rule)", borderRadius: 12, padding: "10px 14px", minWidth: 0 };

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
  const [activityId, setActivityId] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiCooldown, setAiCooldown] = useState(false);
  const [customMoods, setCustomMoods] = useState<{ id: string; emoji: string; label: string; labelTh: string | null; color: string; iconKey: string | null }[]>([]);
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
        setActivityId(data.activityId ?? null);
        setLocation(data.location ?? "");
        setLocationLat(data.locationLat ?? undefined);
        setLocationLng(data.locationLng ?? undefined);
        setIsPremium(data.isPremium);
        setEntryNumber(data.entryNumber ?? null);
        const d = new Date(data.createdAt);
        setDateVal(d.toISOString().slice(0, 10));
        setTimeVal(d.toISOString().slice(11, 16));
      })
      .finally(() => setLoading(false));
    fetch("/api/moods").then((r) => r.ok ? r.json() : { moods: [] }).then((d) => {
      const moods = (d as { moods: { id: string; emoji: string; label: string; labelTh: string | null; color: string; isDefault: boolean; iconKey: string | null }[] }).moods;
      setCustomMoods(moods.filter((m) => !m.isDefault));
    });
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
          imageKey: finalImageKey, aiSummary, aiSource,
          activityId: activityId ?? null,
          location: location.trim() || null, locationLat: locationLat ?? null, locationLng: locationLng ?? null,
          date: dateVal, createdAt,
        }),
      });
      if (!res.ok) { setError(t("errGeneric")); return; }
      trackMoodLog("edit");
      router.replace(`/entry/${id}` as const);
    } finally {
      setSaving(false);
    }
  }, [dateVal, timeVal, note, moodId, tags, sentiment, imageKey, imageFile, aiSummary, aiSource, activityId, location, locationLat, locationLng, id, t, router]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/log/${id}`, { method: "DELETE" });
      if (res.ok) { trackEntryDelete(); router.replace("/" as const); }
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

  const allMoods = [...DEFAULT_MOODS.map((m) => ({ ...m, iconKey: null as string | null })), ...customMoods];
  const mood = allMoods.find((m) => m.id === moodId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const moodLabel = th ? mood?.labelTh : mood?.label;
  const suggestedTags = suggestion?.tags.filter((st) => !tags.includes(st)) ?? [];
  const displayImageUrl = imagePreview ?? imageUrl;
  const iconSrc = (m: { id: string; iconKey: string | null }) => (m.iconKey ? `${R2_PUBLIC_URL}/${m.iconKey}` : moodIconUrl(m.id, pack, iconFormat));

  const entryDate = dateVal ? new Date(dateVal + "T12:00:00") : new Date();
  const weekday = entryDate.toLocaleDateString(th ? "th-TH" : "en-US", { weekday: "long" });
  const formattedDate = entryDate.toLocaleDateString(th ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  const timeLabel = timeVal || "00:00";

  return (
    <>
    <div className="pa-wrap fade-in edit-entry-page" style={{ paddingBottom: 80 }}>
      {/* ── Page Header (loose, theme-adaptive) ── */}
      <div style={{ margin: "8px 0 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 6 }}>
          {t("editingEntry", { n: entryNumber ?? "–" })}
        </div>
        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
          {t("editingTitle", { weekday, date: formattedDate })}
        </h1>
      </div>

      <div className="grid-2col" style={{ alignItems: "start" }}>

        {/* ═══ LEFT — Form on a paper sheet ═══ */}
        <div style={{ position: "relative" }}>
          <span className="pa-tab">{th ? "แก้ไขบันทึก" : "Edit entry"}</span>
          <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "24px 24px 26px", display: "flex", flexDirection: "column", gap: 22, overflow: "hidden" }}>

            {/* ── Mood Picker ── */}
            <div>
              <div style={eyebrow}>{t("feeling")}</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
                {allMoods.map((m) => {
                  const active = m.id === moodId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMoodId(m.id)}
                      aria-pressed={active}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minWidth: 70, padding: "11px 6px 9px", borderRadius: 14,
                        background: "#fff", border: active ? "2px solid var(--w-ink)" : "1px solid var(--w-rule)", cursor: "pointer", fontFamily: "inherit",
                        boxShadow: active ? "0 9px 20px -9px rgba(0,0,0,.3)" : "0 4px 12px -7px rgba(60,40,20,.28)", transform: active ? "translateY(-1px)" : "none",
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: active ? (m.color ?? moodColor) : "var(--w-tint)", display: "grid", placeItems: "center" }}>
                        <img src={iconSrc(m)} alt="" width={30} height={30} style={{ pointerEvents: "none" }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: active ? 800 : 600, color: active ? "var(--w-ink)" : "var(--w-ink-2)", whiteSpace: "nowrap" }}>
                        {th ? m.labelTh : m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Date / Time ── */}
            <div>
              <div style={eyebrow}>{t("dateTime")}</div>
              <div className="edit-datetime-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
                <div style={fieldShell}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--w-ink-3)", flexShrink: 0 }} aria-hidden>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <input type="date" value={dateVal} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDateVal(e.target.value)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "var(--w-ink)", outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={fieldShell}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--w-ink-3)", flexShrink: 0 }} aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <input type="time" value={timeVal} onChange={(e) => setTimeVal(e.target.value)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "var(--w-ink)", outline: "none", fontFamily: "inherit" }} />
                </div>
              </div>
            </div>

            {/* ── Note ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ ...eyebrow, marginBottom: 0 }}>{t("note")}</div>
                <span style={{ fontSize: 14, color: "var(--w-ink-3)" }}>{note.length} / 500 {t("chars")}</span>
              </div>
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => { setNote(e.target.value); if (suggestion) setSuggestion(null); }}
                maxLength={500}
                rows={5}
                className="w-full resize-none"
                style={{ background: "#FBF7F0", color: "var(--w-ink)", borderRadius: 12, border: "1.5px solid var(--w-rule)", padding: "14px 16px", fontSize: 15, lineHeight: 1.6, outline: "none", fontFamily: "inherit" }}
              />
              {/* Toolbar */}
              <div className="edit-toolbar" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <ToolbarBtn icon={<BoldIcon />} label={t("boldToggle")} onClick={handleBoldToggle} />
                <VoiceButton onTranscript={(s) => setNote((p) => (p ? p + " " : "") + s)} />
                {isPremium ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, background: "#fff", border: "1px solid var(--w-rule)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)" }}>
                    <ImageIcon />{t("image")}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceImage(f); }} />
                  </label>
                ) : (
                  <a href="/pricing" style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, background: "var(--w-tint)", textDecoration: "none", fontSize: 14, fontWeight: 700, color: "var(--w-ink-3)" }}>
                    <ImageIcon />{t("image")}
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "var(--w-ink)", padding: "1px 5px", borderRadius: 100, marginLeft: 2 }}>PRO</span>
                  </a>
                )}
                <div className="edit-toolbar-spacer" style={{ flex: 1 }} />
                <button
                  onClick={handleReanalyze}
                  disabled={!note.trim() || analyzing || aiCooldown}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg, #F1E7FA, #F8EDEB)", border: "none", fontWeight: 800, fontSize: 14, color: "var(--purple-strong)", cursor: "pointer", opacity: !note.trim() || analyzing || aiCooldown ? 0.4 : 1, whiteSpace: "nowrap", fontFamily: "inherit" }}
                >
                  <SparkleIcon />{analyzing ? t("reanalyzing") : t("reanalyzeShort")}
                </button>
              </div>
            </div>

            {/* ── Location ── */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ ...eyebrow, marginBottom: 0 }}>{th ? "สถานที่" : "Location"}</div>
                <button type="button" onClick={() => setShowLocationSearch(!showLocationSearch)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 9, background: showLocationSearch ? "var(--w-ink)" : "#fff", border: "1px solid var(--w-rule)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: showLocationSearch ? "#fff" : "var(--w-ink-2)", fontFamily: "inherit" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" /></svg>
                  {th ? "เพิ่ม" : "Add"}
                </button>
              </div>
              {location && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "6px 12px", borderRadius: 100, background: "var(--w-tint)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#A673F1" /></svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink)" }}>{location}</span>
                  <button type="button" onClick={() => setLocation("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="var(--w-ink-3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              )}
              {showLocationSearch && (
                <LocationSearch locale={locale} onSelect={(v, lat, lng) => { setLocation(v); setLocationLat(lat); setLocationLng(lng); setShowLocationSearch(false); }} onClose={() => setShowLocationSearch(false)} />
              )}
            </div>

            {/* ── AI Suggestion Result ── */}
            {suggestion && (
              <div className="fade-in" style={{ padding: "16px 18px", borderRadius: 14, background: "linear-gradient(135deg, #F1E7FA, #F8EDEB)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="var(--purple-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)" }}>{th ? "AI วิเคราะห์แล้ว" : "AI analysis complete"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: suggestion.tags.length > 0 ? 10 : 0 }}>
                  {mood && <PASticker moodId={mood.id} color={mood.color} size={32} borderWidth={3} pack={pack} iconFormat={iconFormat} />}
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--w-ink)" }}>{moodLabel}</span>
                  {suggestion.aiSummary && (
                    <span style={{ fontSize: 14, color: "var(--w-ink-2)", flex: 1 }}>
                      — {suggestion.aiSummary.replace(/\*\*(.*?)\*\*/g, "$1").slice(0, 80)}{(suggestion.aiSummary.length > 80 ? "..." : "")}
                    </span>
                  )}
                </div>
                {suggestion.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {suggestion.tags.map((st, i) => (
                      <span key={i} style={{ padding: "4px 10px", borderRadius: 100, background: "rgba(255,255,255,.72)", fontSize: 14, fontWeight: 600, color: "var(--w-ink)" }}>#{st}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 10 }}><AiDisclaimer variant="parse" /></div>
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FBF7F0", border: "1px solid var(--w-rule)" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--purple-strong)", margin: 0 }}>{error}</p>
              </div>
            )}

            {/* ── Activity ── */}
            <ActivityPicker value={activityId} onChange={setActivityId} />

            {/* ── Tags ── */}
            <div>
              <div style={eyebrow}>{t("tags")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.map((tag, i) => (
                  <span key={i} className="pa-chip" style={{ fontSize: 14, padding: "8px 14px" }}>
                    #{tag}
                    <button onClick={() => setTags(tags.filter((_, j) => j !== i))} aria-label={th ? `ลบแท็ก ${tag}` : `Remove tag ${tag}`} style={{ color: "var(--w-ink-3)", display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                  </span>
                ))}
                {tags.length < 12 && (
                  <form onSubmit={(e) => { e.preventDefault(); handleAddTag(); }} style={{ display: "flex", alignItems: "center" }}>
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder={t("addTag")} style={{ width: 120, background: "transparent", border: "1.5px dashed var(--w-rule-strong)", borderRadius: 100, padding: "7px 12px", outline: "none", fontSize: 14, fontWeight: 700, color: "var(--purple-strong)", fontFamily: "inherit" }} />
                  </form>
                )}
              </div>

              {/* Suggested tags */}
              {suggestedTags.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-3)", marginRight: 10 }}>{t("suggested")}</span>
                  <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {suggestedTags.map((st, i) => (
                      <button key={i} onClick={() => { if (tags.length < 12) setTags([...tags, st]); }} style={{ background: "#fff", border: "1.5px dashed var(--yellow)", padding: "6px 14px", borderRadius: 100, fontSize: 14, fontWeight: 700, color: "var(--w-ink)", cursor: "pointer", fontFamily: "inherit" }}>+ {st}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Image ── */}
            {displayImageUrl && (
              <div style={{ position: "relative" }}>
                <img src={displayImageUrl} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 300, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 8 }}>
                  {isPremium ? (
                    <label style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14, fontWeight: 700, padding: "6px 12px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {t("replacePhoto")}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceImage(f); }} />
                    </label>
                  ) : (
                    <span style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, padding: "6px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {t("replacePhoto")}<span style={{ fontSize: 14, fontWeight: 800, marginLeft: 2 }}>PRO</span>
                    </span>
                  )}
                  <button onClick={handleDeleteImage} style={{ background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Danger Zone (mobile only — sidebar hidden) ── */}
          <div className="edit-mobile-only" style={{ marginTop: 16 }}>
            <DangerZone t={t} onDelete={() => setShowDeleteConfirm(true)} />
          </div>
        </div>

        {/* ═══ RIGHT — Sidebar ═══ */}
        <div className="edit-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 32 }}>

          {/* ── Live Preview ── */}
          <div style={{ position: "relative" }}>
            <span className="pa-tab mint" style={{ fontSize: 12, padding: "8px 16px 10px" }}>
              {t("livePreview")} <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#34D399", marginLeft: 4 }} />
            </span>
            <div className="pa-sheet" style={{ borderRadius: "4px 16px 16px 16px", padding: "20px 22px 22px", position: "relative", overflow: "hidden" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${moodColor}, transparent 70%)`, opacity: 0.5 }} />
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-3)", marginBottom: 16 }}>{weekday} · {timeLabel}</div>
                <div style={{ textAlign: "center", marginBottom: tags.length > 0 ? 12 : 0 }}>
                  {mood && <PASticker moodId={mood.id} color={moodColor} size={72} pack={pack} iconFormat={iconFormat} style={{ margin: "0 auto 12px", transform: "rotate(-6deg)" }} />}
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--w-ink)" }}>{moodLabel}</div>
                </div>
                {tags.length > 0 && (
                  <div style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--w-ink-3)" }}>{tags.map((tg) => `#${tg}`).join(" · ")}</div>
                )}
              </div>
            </div>
          </div>

          {/* ── AI Insight ── */}
          {aiSummary && (
            <div className="pa-sheet" style={{ borderRadius: 16, padding: "18px 20px", position: "relative", background: "linear-gradient(135deg, #F1E7FA, #F8EDEB)" }}>
              <span className="pa-washi yellow" aria-hidden style={{ width: 88 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, marginBottom: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="var(--purple-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--purple-strong)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t("aiInsightTitle")}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--w-ink)" }} dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 10 }}>{t("aiInsightNote")}</div>
              <div style={{ marginTop: 8 }}><AiDisclaimer variant="analysis" /></div>
            </div>
          )}

          {/* ── Keyboard Shortcuts ── */}
          <div className="pa-sheet" style={{ borderRadius: 16, padding: "18px 20px" }}>
            <div style={eyebrow}>{t("shortcuts")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ShortcutRow label={t("shortcutSave")} keys={["⌘", "S"]} />
              <ShortcutRow label={t("shortcutCancel")} keys={["Esc"]} />
              <ShortcutRow label={t("shortcutAi")} keys={["⌘", "↵"]} />
            </div>
          </div>

          {/* ── Save / Cancel (desktop) ── */}
          <button onClick={handleSave} disabled={saving} className="pa-btn" style={{ width: "100%", height: 48, opacity: saving ? 0.6 : 1 }}>
            {saving ? t("saving") : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t("saveChanges")}
              </>
            )}
          </button>
          <button onClick={() => router.back()} style={{ width: "100%", height: 44, background: "#fff", border: "1.5px solid var(--w-rule)", borderRadius: 12, fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)", cursor: "pointer", fontFamily: "inherit" }}>
            {t("cancel")}
          </button>

          {/* ── Danger Zone ── */}
          <DangerZone t={t} onDelete={() => setShowDeleteConfirm(true)} />
        </div>
      </div>
    </div>

      {/* ── Mobile Bottom Bar ── */}
      {typeof document !== "undefined" && createPortal(
        <div className="edit-bottom-bar">
          <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 768, margin: "0 auto" }}>
            <button onClick={() => router.back()} style={{ height: 48, padding: "0 20px", background: "var(--surface)", border: "1.5px solid var(--hairline)", borderRadius: 100, fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
              {t("cancel")}
            </button>
            <button onClick={handleSave} disabled={saving} className="pa-btn flex-1" style={{ height: 48, opacity: saving ? 0.6 : 1 }}>
              {saving ? t("saving") : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t("saveChanges")}
                </>
              )}
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "var(--ink)", color: "var(--bg)", padding: "10px 20px", borderRadius: 100, fontSize: 14, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* ── Delete Confirm Overlay ── */}
      {showDeleteConfirm && createPortal(
        <div className="pa-wrap fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(26,19,32,.46)", backdropFilter: "blur(6px)" }}>
          <div className="pa-sheet" style={{ borderRadius: "8px 26px 26px 26px", padding: "28px 24px", width: "min(360px, 90vw)", textAlign: "center", position: "relative" }}>
            <span className="pa-washi lav" aria-hidden style={{ width: 96, top: -13 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--w-ink)", marginTop: 6, marginBottom: 8 }}>{t("deleteConfirmTitle")}</div>
            <p style={{ fontSize: 14, color: "var(--w-ink-2)", marginBottom: 20, lineHeight: 1.6 }}>{t("deleteConfirmBody")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1" style={{ height: 44, background: "#fff", border: "1.5px solid var(--w-rule)", borderRadius: 12, fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)", cursor: "pointer", fontFamily: "inherit" }}>
                {t("deleteCancel")}
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1" style={{ height: 44, background: "#DC2626", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, opacity: deleting ? 0.6 : 1, cursor: "pointer", fontFamily: "inherit" }}>
                {deleting ? t("deleting") : t("deleteConfirm")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ─── Sub-components ─── */

function DangerZone({ t, onDelete }: { t: ReturnType<typeof useTranslations>; onDelete: () => void }) {
  return (
    <div className="pa-sheet" style={{ borderRadius: 16, padding: 18, border: "1.5px solid #FCA5A5" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#DC2626", marginBottom: 6 }}>{t("dangerZone")}</div>
      <p style={{ fontSize: 14, color: "var(--w-ink-2)", margin: "0 0 12px" }}>{t("dangerZoneNote")}</p>
      <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "none", border: "1.5px solid #FCA5A5", fontSize: 14, fontWeight: 800, color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        {t("deleteEntry")}
      </button>
    </div>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink)" }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {keys.map((k, i) => (
          <kbd key={i} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 28, height: 28, padding: "0 8px", borderRadius: 8, background: "var(--w-tint)", border: "1px solid var(--w-rule)", fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)", fontFamily: "inherit" }}>{k}</kbd>
        ))}
      </div>
    </div>
  );
}

function ToolbarBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, background: "#fff", border: "1px solid var(--w-rule)", fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)", cursor: "pointer", fontFamily: "inherit" }}>
      {icon}{label}
    </button>
  );
}

function BoldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 4h8a4 4 0 010 8H6V4zM6 12h9a4 4 0 010 8H6V12z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="pa-wrap pt-8 fade-in">
      <div style={{ height: 20, width: 200, borderRadius: 8, background: "var(--w-tint)", opacity: 0.6, marginBottom: 8 }} />
      <div style={{ height: 32, width: 360, maxWidth: "80%", borderRadius: 8, background: "var(--w-tint)", opacity: 0.5, marginBottom: 24 }} />
      <div className="grid-2col" style={{ alignItems: "start" }}>
        <div className="pa-sheet" style={{ height: 420, borderRadius: "4px 18px 18px 18px", opacity: 0.5 }} />
        <div className="edit-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="pa-sheet" style={{ height: 200, borderRadius: 16, opacity: 0.5 }} />
          <div className="pa-sheet" style={{ height: 120, borderRadius: 16, opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}
