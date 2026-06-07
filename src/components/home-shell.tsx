"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";
import { SmartLogModal } from "./smart-log-modal";
import { AiDisclaimer } from "./ai-disclaimer";
import { optimizeImage } from "@/lib/client-image";
import { VoiceButton } from "./voice-button";
import { LocationSearch } from "./location-picker";
import { trackMoodLog } from "@/lib/analytics";
import { ActivityPicker } from "./activity-picker";
import { InstallAppPrompt } from "./install-app-prompt";
import { Link, useRouter } from "@/i18n/navigation";
import { PaperIconButton } from "./paper/paper-icon-button";
import { GreetingFolder } from "./paper/today/greeting-folder";
import { TodayTimeline } from "./paper/today/today-timeline";
import { EntryFolderCard } from "./paper/today/entry-folder-card";
import { AiWeeklyFolder } from "./paper/today/ai-weekly-folder";
import { StreakCard } from "./paper/today/streak-card";
import { MiniCalendarFolder } from "./paper/today/mini-calendar-folder";
import { EmptyToday } from "./paper/today/empty-today";
import type { SpecialDay } from "@/db/schema";

type Tier = "guest" | "free" | "premium";

interface Entry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  aiSource?: string;
  imageUrl?: string | null;
  location?: string | null;
  date: string;
  createdAt: string | number;
}

interface Stats {
  streak: number;
  todayMood: { moodId: string; createdAt: number } | null;
  last7: { date: string; moodId: string | null }[];
  distribution: Record<string, number>;
  total30d: number;
}

export type CustomMoodItem = { id: string; emoji: string; label: string; labelTh: string | null; color: string; iconKey: string | null };

export function HomeShell({
  tier,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
  hidePreview = false,
  initialCustomMoods = [],
}: {
  tier: Tier;
  pack?: string;
  iconFormat?: string;
  hidePreview?: boolean;
  initialCustomMoods?: CustomMoodItem[];
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const customIcon = (m: { id: string; iconKey: string | null }) =>
    m.iconKey ? `${R2_PUBLIC_URL}/${m.iconKey}` : moodIconUrl(m.id, pack, iconFormat);

  const [logMoodId, setLogMoodId] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const focusComposer = () => {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    composerRef.current?.focus({ preventScroll: true });
  };
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [customMoods, setCustomMoods] = useState<CustomMoodItem[]>(initialCustomMoods);
  const [insightData, setInsightData] = useState<{ headline: string; summary: string } | null>(null);

  // Inline AI composer state
  const [composerText, setComposerText] = useState("");
  const [composerAnalyzing, setComposerAnalyzing] = useState(false);
  const [composerSuggestion, setComposerSuggestion] = useState<{
    suggestedMoodId: string;
    sentiment: number | null;
    tags: string[];
    imageKey: string | null;
    aiSource: string;
    aiSummary: string | null;
    suggestedActivityId?: string | null;
  } | null>(null);
  const [composerMoodId, setComposerMoodId] = useState("neutral");
  const [composerTags, setComposerTags] = useState<string[]>([]);
  const [composerImage, setComposerImage] = useState<File | null>(null);
  const [composerImagePreview, setComposerImagePreview] = useState<string | null>(null);
  const [composerBusy, setComposerBusy] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerAiBlocked, setComposerAiBlocked] = useState(false);
  const [composerLocation, setComposerLocation] = useState("");
  const [composerLocationLat, setComposerLocationLat] = useState<number | undefined>();
  const [composerLocationLng, setComposerLocationLng] = useState<number | undefined>();
  const [showComposerLocationSearch, setShowComposerLocationSearch] = useState(false);
  const [composerActivityId, setComposerActivityId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [todaySpecialDays, setTodaySpecialDays] = useState<SpecialDay[]>([]);
  const composerHasInput = composerText.trim().length > 0 || !!composerImage;

  function handleComposerImage(file: File) {
    setComposerImage(file);
    setComposerImagePreview(URL.createObjectURL(file));
  }

  async function handleComposerAnalyze() {
    if (!composerText.trim() && !composerImage) return;
    setComposerAnalyzing(true);
    setComposerError(null);
    try {
      const fd = new FormData();
      if (composerText.trim()) fd.append("text", composerText.trim());
      if (composerImage) {
        const opt = await optimizeImage(composerImage);
        fd.append("image", opt);
      }
      const res = await fetch("/api/log/smart", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number; imageKey?: string };
        if (j.error === "rate_limited") {
          if (j.imageKey) {
            setComposerSuggestion({ suggestedMoodId: composerMoodId, sentiment: null, tags: [], imageKey: j.imageKey, aiSource: "manual", aiSummary: null });
          }
          setComposerAiBlocked(true);
          if (tier === "premium") {
            const min = Math.ceil((j.retryAfterSec ?? 300) / 60);
            setComposerError(locale === "th" ? `AI พร้อมใช้อีกครั้งใน ${min} นาที` : `AI available again in ${min} min`);
          }
        } else {
          setComposerError(locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again.");
        }
        return;
      }
      const s = (await res.json()) as {
        suggestedMoodId: string;
        sentiment: number | null;
        tags: string[];
        imageKey: string | null;
        aiSource: string;
        aiSummary: string | null;
        suggestedActivityId?: string | null;
      };
      setComposerSuggestion(s);
      setComposerMoodId(s.suggestedMoodId);
      setComposerTags(s.tags);
      if (s.suggestedActivityId) setComposerActivityId(s.suggestedActivityId);
    } catch {
      setComposerError("error");
    } finally {
      setComposerAnalyzing(false);
    }
  }

  async function handleComposerSave() {
    if (!composerText.trim() && !composerImage) return;
    setComposerBusy(true);
    setComposerError(null);
    try {
      let imageKey = composerSuggestion?.imageKey ?? null;
      if (!imageKey && composerImage) {
        const fd = new FormData();
        const opt = await optimizeImage(composerImage);
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
          moodTypeId: composerMoodId,
          note: composerText.trim() || undefined,
          tags: composerSuggestion ? composerTags : undefined,
          sentiment: composerSuggestion?.sentiment ?? null,
          imageKey,
          aiSummary: composerSuggestion?.aiSummary ?? null,
          aiSource: composerSuggestion?.aiSource ?? "manual",
          activityId: composerActivityId || undefined,
          location: composerLocation.trim() || undefined,
          locationLat: composerLocationLat ?? undefined,
          locationLng: composerLocationLng ?? undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
        if (j.error === "rate_limited") {
          const min = Math.ceil((j.retryAfterSec ?? 300) / 60);
          setComposerError(locale === "th" ? `โพสได้อีกครั้งใน ${min} นาที` : `Try again in ${min} min`);
        } else {
          setComposerError(j.error ?? "error");
        }
        return;
      }
      setComposerText("");
      setComposerSuggestion(null);
      setComposerTags([]);
      setComposerMoodId("neutral");
      setComposerImage(null);
      setComposerImagePreview(null);
      setComposerLocation("");
      setComposerLocationLat(undefined);
      setComposerLocationLng(undefined);
      if (tier === "premium") setComposerAiBlocked(false);
      setComposerError(null);
      trackMoodLog("smart_log");
      setRefreshKey((k) => k + 1);
      setToast(locale === "th" ? "บันทึกแล้ว ✓" : "Saved ✓");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setComposerBusy(false);
    }
  }
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDateStr = `${todayYear}-${String(todayMonth).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    Promise.all([
      fetch("/api/log?limit=50").then((r) => (r.ok ? r.json() : { entries: [] })),
      fetch("/api/stats").then((r) =>
        r.ok
          ? r.json()
          : { streak: 0, todayMood: null, last7: [], distribution: {}, total30d: 0 },
      ),
      fetch("/api/moods").then((r) => (r.ok ? r.json() : { moods: [] })),
      fetch(`/api/events?year=${todayYear}&month=${todayMonth}`).then((r) => (r.ok ? r.json() : { events: [] })),
    ]).then(([logData, statsData, moodsData, eventsData]) => {
      if (!alive) return;
      const allEntries = (logData as { entries: Entry[] }).entries;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      setEntries(allEntries.filter((e) => new Date(e.createdAt) >= sevenDaysAgo));
      setStats(statsData as Stats);
      const allMoods = (moodsData as { moods: { id: string; emoji: string; label: string; labelTh: string | null; color: string; isDefault: boolean; iconKey: string | null }[] }).moods;
      setCustomMoods(allMoods.filter((m) => !m.isDefault));
      setTodaySpecialDays((eventsData as { events: SpecialDay[] }).events.filter((e) => e.date === todayDateStr));
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  // Weekly AI insight (premium only, cache-only — lifted from the old sidebar card)
  useEffect(() => {
    if (tier !== "premium") return;
    fetch(`/api/insights?locale=${locale}&cacheOnly=1`)
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
      .then((json) => {
        if (!json || json.empty || json.tooFewEntries) return;
        setInsightData({ headline: json.headline as string, summary: json.summary as string });
      })
      .catch(() => {});
  }, [locale, tier]);

  const streak = stats?.streak ?? 0;
  const _hour = new Date().getHours();
  const greetTime = locale === "th"
    ? (_hour < 12 ? "สวัสดีตอนเช้า" : _hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น")
    : (_hour < 12 ? "Good morning" : _hour < 17 ? "Good afternoon" : "Good evening");
  const dateTabLabel = new Date().toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "long", day: "numeric", month: "short" });
  const todayStr = new Date().toDateString();
  const todayEntries = entries?.filter((e) => new Date(e.createdAt).toDateString() === todayStr) ?? [];

  const pickerMoods = [
    ...DEFAULT_MOODS.map((m) => ({ id: m.id, label: m.label, labelTh: m.labelTh, color: m.color, iconKey: null as string | null })),
    ...customMoods.map((m) => ({ id: m.id, label: m.label, labelTh: m.labelTh, color: m.color, iconKey: m.iconKey })),
  ];
  const allMoodsForCards = [
    ...DEFAULT_MOODS.map((m) => ({ id: m.id, color: m.color, label: m.label, labelTh: m.labelTh, iconKey: null as string | null })),
    ...customMoods.map((m) => ({ id: m.id, color: m.color, label: m.label, labelTh: m.labelTh, iconKey: m.iconKey })),
  ];

  function entryTab(createdAt: string | number): { label: string; variant: "" | "mint" | "lav" } {
    const h = new Date(createdAt).getHours();
    if (h < 12) return { label: locale === "th" ? "เช้า" : "Morning", variant: "" };
    if (h < 17) return { label: locale === "th" ? "บ่าย" : "Afternoon", variant: "mint" };
    return { label: locale === "th" ? "เย็น" : "Evening", variant: "lav" };
  }

  const composerShowSave = (composerSuggestion || composerAiBlocked) && !composerAnalyzing;

  return (
    <>
      <div className="pa-wrap pa-desk">
        <div className="pa-today-grid">
          {/* ── LEFT COLUMN ── */}
          <div>
            <GreetingFolder
              locale={locale}
              greetTime={greetTime}
              dateTabLabel={dateTabLabel}
              moods={pickerMoods}
              pack={pack}
              iconFormat={iconFormat}
              specialDays={todaySpecialDays}
              onMoodSelect={setLogMoodId}
            />

            {/* ── AI MOOD ASSISTANT composer ── */}
            <div className="pa-sheet" style={{ borderRadius: 16, padding: "22px 24px", position: "relative", overflow: "hidden", marginBottom: 30 }}>
              <div aria-hidden style={{ position: "absolute", top: -44, right: -30, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, var(--lavender), transparent 70%)", opacity: 0.55 }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--purple), #C9A6F5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--purple-strong)", textTransform: "uppercase", letterSpacing: ".08em" }}>AI MOOD ASSISTANT</span>
                </div>

                <textarea
                  ref={composerRef}
                  value={composerText}
                  onChange={(e) => {
                    setComposerText(e.target.value);
                    if (composerSuggestion) { setComposerSuggestion(null); setComposerTags([]); }
                  }}
                  placeholder={t("smartLogHint")}
                  rows={3}
                  style={{ width: "100%", resize: "none", minHeight: 96, background: "var(--w-surface-2)", color: "var(--w-ink)", borderRadius: 12, border: "1.5px solid var(--w-rule)", padding: "14px 16px", fontSize: 15, lineHeight: 1.6, outline: "none", fontFamily: "inherit" }}
                />

                {composerImagePreview && (
                  <div style={{ display: "inline-flex", position: "relative", marginTop: 10 }}>
                    <img src={composerImagePreview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12 }} />
                    <button onClick={() => { setComposerImage(null); setComposerImagePreview(null); }} aria-label={locale === "th" ? "ลบรูป" : "Remove image"} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--w-ink)", color: "var(--bg)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                )}

                {composerLocation && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 12px", borderRadius: 100, background: "var(--w-tint)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#A673F1" /></svg>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink)" }}>{composerLocation}</span>
                    <button type="button" onClick={() => setComposerLocation("")} aria-label={locale === "th" ? "ลบสถานที่" : "Remove location"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="var(--w-ink-3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                )}

                {composerError && (
                  <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "var(--w-surface-2)", border: "1px solid var(--w-rule)" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--purple-strong)", margin: 0 }}>{composerError}</p>
                  </div>
                )}

                {composerAnalyzing && (
                  <div className="fade-in" style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "var(--w-ai-grad)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="pulse" style={{ width: 24, height: 24, borderRadius: 7, background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)" }}>
                        {locale === "th" ? "AI กำลังอ่านวันของคุณ..." : "AI is reading your day..."}
                      </span>
                    </div>
                  </div>
                )}

                {/* Mood pills (after AI result OR blocked) */}
                {(composerSuggestion || composerAiBlocked) && !composerAnalyzing && (
                  <div className="fade-in" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                    {pickerMoods.map((m) => {
                      const active = m.id === composerMoodId;
                      const label = (locale === "th" ? m.labelTh : m.label) ?? m.label;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setComposerMoodId(m.id)}
                          aria-pressed={active}
                          className="transition active:scale-95"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: active ? m.color : "var(--w-surface)", color: active ? "#fff" : "var(--w-ink-2)", padding: "6px 12px", borderRadius: 100, fontSize: 14, fontWeight: 700, border: active ? "none" : "1px solid var(--w-rule)", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <img src={customIcon(m)} alt="" width={16} height={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tag pills */}
                {composerSuggestion && !composerAnalyzing && composerTags.length > 0 && (
                  <div className="fade-in" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {composerTags.map((tag, i) => (
                      <span key={i} className="pa-chip" style={{ fontSize: 12, padding: "6px 11px" }}>
                        #{tag}
                        <button onClick={() => setComposerTags((p) => p.filter((_, j) => j !== i))} aria-label={locale === "th" ? `ลบแท็ก ${tag}` : `Remove tag ${tag}`} style={{ color: "var(--w-ink-3)", display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* AI summary */}
                {composerSuggestion && !composerAnalyzing && composerSuggestion.aiSummary && (
                  <div className="fade-in" style={{ marginTop: 10, padding: "12px 14px", borderRadius: 14, background: "var(--w-chip)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--w-ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                      {locale === "th" ? "สรุป" : "Summary"}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--w-ink)" }} dangerouslySetInnerHTML={{ __html: composerSuggestion.aiSummary.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
                  </div>
                )}

                {/* Activity picker */}
                {!composerAnalyzing && (
                  <div style={{ marginTop: 12 }}>
                    <ActivityPicker value={composerActivityId} onChange={setComposerActivityId} compact />
                  </div>
                )}

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <VoiceButton onTranscript={(s) => setComposerText((p) => (p ? p + " " : "") + s)} />
                  {tier === "premium" ? (
                    <PaperIconButton asLabel title={locale === "th" ? "แนบรูป" : "Attach photo"} ariaLabel={locale === "th" ? "แนบรูป" : "Attach photo"}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleComposerImage(f); }} />
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
                    active={showComposerLocationSearch}
                    onClick={() => setShowComposerLocationSearch(!showComposerLocationSearch)}
                    title={locale === "th" ? "สถานที่" : "Location"}
                    ariaLabel={locale === "th" ? "เพิ่มสถานที่" : "Add location"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg>
                  </PaperIconButton>
                  <div style={{ flex: 1 }} />
                  {composerShowSave ? (
                    <button
                      onClick={handleComposerSave}
                      disabled={!composerHasInput || composerBusy}
                      className="pa-btn ink transition active:scale-[0.97]"
                      style={{ opacity: !composerHasInput || composerBusy ? 0.5 : 1 }}
                    >
                      {composerBusy ? (locale === "th" ? "กำลังบันทึก..." : "Saving...") : (locale === "th" ? "บันทึก" : "Save mood")}
                    </button>
                  ) : !composerAnalyzing ? (
                    <button
                      onClick={handleComposerAnalyze}
                      disabled={!composerHasInput}
                      className="pa-btn purple transition active:scale-[0.97]"
                      style={{ opacity: !composerHasInput ? 0.5 : 1 }}
                    >
                      {locale === "th" ? "วิเคราะห์" : "Analyze"}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  ) : null}
                </div>

                {showComposerLocationSearch && (
                  <LocationSearch
                    locale={locale}
                    onSelect={(v, lat, lng) => { setComposerLocation(v); setComposerLocationLat(lat); setComposerLocationLng(lng); setShowComposerLocationSearch(false); }}
                    onClose={() => setShowComposerLocationSearch(false)}
                  />
                )}

                <div style={{ marginTop: 14 }}>
                  <AiDisclaimer variant="analysis" />
                </div>

                {/* Upgrade nudge (free) */}
                {tier !== "premium" && (
                  <Link href={"/pricing" as "/"} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "var(--w-ai-grad)", textDecoration: "none" }}>
                    <span style={{ background: "var(--w-ink)", color: "var(--bg)", fontSize: 11, fontWeight: 800, padding: "2px 7px", borderRadius: 100, letterSpacing: ".04em", flexShrink: 0 }}>PRO</span>
                    <span style={{ fontSize: 14, lineHeight: 1.4, color: "var(--w-ink-2)", fontWeight: 600 }}>
                      {locale === "th" ? <>ใช้ AI ได้ <b>3 ครั้ง/วัน</b> — <span style={{ color: "var(--purple-strong)", fontWeight: 800 }}>อัปเกรด Pro</span> เพื่อใช้ได้ไม่จำกัด</> : <>3 free AI analyses per day — <span style={{ color: "var(--purple-strong)", fontWeight: 800 }}>upgrade to Pro</span> for unlimited</>}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* ── TODAY TIMELINE ── */}
            <TodayTimeline locale={locale} todayEntries={todayEntries} entryCount={todayEntries.length} moodColors={allMoodsForCards} />

            {/* ── ENTRY CARDS ── */}
            {entries === null ? (
              <div className="pa-entries-grid">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="pa-sheet" style={{ height: 150, opacity: 0.5 }} />
                ))}
              </div>
            ) : todayEntries.length > 0 ? (
              <div className="pa-entries-grid">
                {todayEntries.map((entry, i) => {
                  const tab = entryTab(entry.createdAt);
                  const mood = allMoodsForCards.find((m) => m.id === entry.moodTypeId);
                  return (
                    <EntryFolderCard
                      key={entry.id}
                      entry={entry}
                      mood={mood}
                      locale={locale}
                      blur={hidePreview}
                      pack={pack}
                      iconFormat={iconFormat}
                      tabLabel={tab.label}
                      tabVariant={tab.variant}
                      rotation={i % 2 ? 0.6 : -0.6}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyToday locale={locale} pack={pack} iconFormat={iconFormat} onWriteFreely={focusComposer} />
            )}
          </div>

          {/* ── RIGHT RAIL ── */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <AiWeeklyFolder tier={tier} locale={locale} insight={insightData} />
            <StreakCard streak={streak} locale={locale} />
            <MiniCalendarFolder locale={locale} />
          </aside>
        </div>
      </div>

      {/* ── SMART LOG MODAL ── */}
      {logMoodId && (
        <SmartLogModal
          tier={tier}
          pack={pack}
          iconFormat={iconFormat}
          preSelectedMoodId={logMoodId}
          customMoods={customMoods}
          onClose={() => setLogMoodId(null)}
          onSaved={() => {
            setLogMoodId(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <InstallAppPrompt />

      {toast && (
        <div
          className="fixed left-1/2 pop"
          style={{ top: 24, transform: "translateX(-50%)", background: "#0A0A0A", color: "#fff", padding: "10px 20px", borderRadius: 100, fontSize: 14, fontWeight: 700, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
