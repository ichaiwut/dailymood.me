"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";
import { SmartLogModal } from "./smart-log-modal";
import { AiDisclaimer } from "./ai-disclaimer";
import { optimizeImage } from "@/lib/client-image";
import { VoiceButton } from "./voice-button";
import { Link } from "@/i18n/navigation";

type Tier = "guest" | "free" | "premium";

interface Entry {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  aiSource?: string;
  imageUrl?: string | null;
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

export function HomeShell({
  tier,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
  hidePreview = false,
}: {
  tier: Tier;
  pack?: string;
  iconFormat?: string;
  hidePreview?: boolean;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const icon = (moodId: string) => moodIconUrl(moodId, pack, iconFormat);

  const [logMoodId, setLogMoodId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [customMoods, setCustomMoods] = useState<{ id: string; emoji: string; label: string; labelTh: string | null; color: string; iconKey: string | null }[]>([]);

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
  } | null>(null);
  const [composerMoodId, setComposerMoodId] = useState("neutral");
  const [composerTags, setComposerTags] = useState<string[]>([]);
  const [composerImage, setComposerImage] = useState<File | null>(null);
  const [composerImagePreview, setComposerImagePreview] = useState<string | null>(null);
  const [composerBusy, setComposerBusy] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerAiBlocked, setComposerAiBlocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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
      };
      setComposerSuggestion(s);
      setComposerMoodId(s.suggestedMoodId);
      setComposerTags(s.tags);
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
      if (tier === "premium") setComposerAiBlocked(false);
      setComposerError(null);
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
    Promise.all([
      fetch("/api/log?limit=50").then((r) => (r.ok ? r.json() : { entries: [] })),
      fetch("/api/stats").then((r) =>
        r.ok
          ? r.json()
          : { streak: 0, todayMood: null, last7: [], distribution: {}, total30d: 0 },
      ),
      fetch("/api/moods").then((r) => (r.ok ? r.json() : { moods: [] })),
    ]).then(([logData, statsData, moodsData]) => {
      if (!alive) return;
      const allEntries = (logData as { entries: Entry[] }).entries;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      setEntries(allEntries.filter((e) => new Date(e.createdAt) >= sevenDaysAgo));
      setStats(statsData as Stats);
      const allMoods = (moodsData as { moods: { id: string; emoji: string; label: string; labelTh: string | null; color: string; isDefault: boolean; iconKey: string | null }[] }).moods;
      setCustomMoods(allMoods.filter((m) => !m.isDefault));
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const streak = stats?.streak ?? 0;
  const _hour = new Date().getHours();
  const greetTime = locale === "th"
    ? (_hour < 12 ? "สวัสดีตอนเช้า" : _hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น")
    : (_hour < 12 ? "Good morning" : _hour < 17 ? "Good afternoon" : "Good evening");
  const todayStr = new Date().toDateString();
  const todayEntries = entries?.filter(e => new Date(e.createdAt).toDateString() === todayStr) ?? [];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 24 }} className="home-grid">
      {/* ── LEFT COLUMN ── */}
      <div>

      {/* ── GREETING HERO + MOOD PICKER ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "40ms" }}>
        <div
          className="hero-card"
          style={{
            borderRadius: 18,
            padding: "32px 36px",
            background: "linear-gradient(135deg, #F8EDEB 0%, #E9DEF6 100%)",
            position: "relative",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--purple)", marginBottom: 6 }}>
            {greetTime} · {new Date().toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "long", day: "numeric", month: "short" })}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "4px 0 18px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            {locale === "th" ? "วันนี้คุณรู้สึกยังไง?" : "How are you feeling?"}
          </h1>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }} className="mood-picker no-scrollbar">
            {DEFAULT_MOODS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setLogMoodId(m.id)}
                style={{
                  minWidth: 72,
                  flex: "0 0 auto",
                  padding: "14px 8px 10px",
                  borderRadius: 14,
                  background: "#fff",
                  border: i === 0 ? "2px solid var(--peach)" : "1.5px solid rgba(0,0,0,.06)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "inherit",
                  boxShadow: i === 0 ? "0 6px 16px -6px rgba(252,164,91,.5)" : "0 1px 3px rgba(0,0,0,.04)",
                }}
              >
                <img src={icon(m.id)} alt="" width={36} height={36} style={{ pointerEvents: "none" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                  {locale === "th" ? m.labelTh : m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI COMPOSER CARD ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "60ms" }}>
        <div
          className="card"
          style={{
            padding: "20px 18px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              background: "radial-gradient(circle, rgba(166,115,241,0.18), transparent 70%)",
            }}
          />
          <div className="flex items-center gap-2 mb-3" style={{ position: "relative" }}>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", letterSpacing: "0.3px" }}>
              AI MOOD ASSISTANT
            </span>
          </div>

          {/* Textarea */}
          <textarea
            value={composerText}
            onChange={(e) => {
              setComposerText(e.target.value);
              if (composerSuggestion) {
                setComposerSuggestion(null);
                setComposerTags([]);
              }
            }}
            placeholder={t("smartLogHint")}
            rows={3}
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

          {/* Image preview */}
          {composerImagePreview && (
            <div style={{ display: "inline-flex", position: "relative", marginTop: 10 }}>
              <img src={composerImagePreview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12 }} />
              <button
                onClick={() => { setComposerImage(null); setComposerImagePreview(null); }}
                style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}
              >
                ×
              </button>
            </div>
          )}

          {/* Error / Info */}
          {composerError && (
            <div className="mt-2.5" style={{ padding: "10px 14px", borderRadius: 12, background: "#F4EEFB", border: "1px solid #E6DBF7" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#7A4DD0" }}>
                {composerError}
              </p>
            </div>
          )}

          {/* AI analyzing state */}
          {composerAnalyzing && (
            <div className="mt-3 fade-in" style={{ padding: "14px", borderRadius: 18, background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)" }}>
              <div className="flex items-center gap-2">
                <div className="pulse" style={{ width: 24, height: 24, borderRadius: 7, background: "#A673F1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.4px" }}>
                  {locale === "th" ? "AI กำลังอ่านวันของคุณ..." : "AI IS READING YOUR DAY..."}
                </span>
              </div>
            </div>
          )}

          {/* Mood pills (after AI result OR AI blocked) */}
          {(composerSuggestion || composerAiBlocked) && !composerAnalyzing && (
            <div className="flex flex-wrap gap-1.5 mt-3 fade-in">
              {DEFAULT_MOODS.map((m) => {
                const active = m.id === composerMoodId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setComposerMoodId(m.id)}
                    className="flex items-center gap-1 transition active:scale-95"
                    style={{
                      background: active ? m.color : "#fff",
                      color: active ? "#fff" : "var(--ink-2)",
                      padding: "5px 10px",
                      borderRadius: 100,
                      fontSize: 14,
                      fontWeight: 700,
                      border: active ? "none" : "1.5px solid #F0EAF7",
                    }}
                  >
                    <img src={icon(m.id)} alt="" width={16} height={16} />
                    {locale === "th" ? m.labelTh : m.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tag pills (after AI result) */}
          {composerSuggestion && !composerAnalyzing && composerTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 fade-in">
              {composerTags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1" style={{ background: "#fff", border: "1.5px solid #F0EAF7", padding: "5px 10px", borderRadius: 100, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {tag}
                  <button onClick={() => setComposerTags((p) => p.filter((_, j) => j !== i))} style={{ color: "var(--ink-3)", display: "flex" }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Bottom bar: voice + camera + action button */}
          <div className="flex items-center gap-2 mt-3">
            <VoiceButton onTranscript={(s) => setComposerText((p) => (p ? p + " " : "") + s)} />
            <label
              className="icon-btn"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                cursor: tier === "premium" ? "pointer" : "default",
                opacity: tier === "premium" ? 1 : 0.45,
                position: "relative",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tier !== "premium" && (
                <span style={{
                  position: "absolute",
                  top: -4,
                  right: -6,
                  background: "#0A0A0A",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "1px 4px",
                  borderRadius: 4,
                  letterSpacing: "0.3px",
                  lineHeight: 1.3,
                }}>
                  PRO
                </span>
              )}
              {tier === "premium" && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleComposerImage(f);
                  }}
                />
              )}
            </label>
            <div style={{ flex: 1 }} />
            {(composerSuggestion || composerAiBlocked) && !composerAnalyzing ? (
              <button
                onClick={handleComposerSave}
                disabled={!composerHasInput || composerBusy}
                className="flex items-center justify-center gap-2 transition active:scale-[0.97]"
                style={{
                  height: 42,
                  padding: "0 20px",
                  background: "#0A0A0A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 100,
                  fontWeight: 700,
                  fontSize: 14,
                  opacity: !composerHasInput || composerBusy ? 0.4 : 1,
                }}
              >
                {composerBusy
                  ? (locale === "th" ? "กำลังบันทึก..." : "Saving...")
                  : (locale === "th" ? "บันทึก" : "Save mood")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : !composerAnalyzing ? (
              <button
                onClick={handleComposerAnalyze}
                disabled={!composerHasInput || composerAnalyzing}
                className="flex items-center justify-center gap-2 transition active:scale-[0.97]"
                style={{
                  height: 42,
                  padding: "0 20px",
                  background: "#0A0A0A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 100,
                  fontWeight: 700,
                  fontSize: 14,
                  opacity: !composerHasInput ? 0.4 : 1,
                }}
              >
                {locale === "th" ? "วิเคราะห์" : "Analyze"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="mt-3">
            <AiDisclaimer variant="analysis" />
          </div>

          {/* Upgrade nudge for free users */}
          {tier !== "premium" && (
            <a
              href="/pricing"
              className="flex items-center gap-2.5 mt-3"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #F4EBFE 0%, #FDE8DA 100%)",
                textDecoration: "none",
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#0A0A0A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                flexShrink: 0,
                letterSpacing: "0.3px",
              }}>
                PRO
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.4, color: "#7A4DD0", fontWeight: 600 }}>
                {locale === "th"
                  ? "ใช้ AI ได้ 3 ครั้ง/วัน — อัปเกรด Premium เพื่อใช้ได้ไม่จำกัด"
                  : "3 free AI analyses per day — upgrade to Premium for unlimited"}
              </p>
            </a>
          )}
        </div>
      </section>

      {/* ── TODAY'S ENTRIES (as cards grid on desktop) ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {t("todayEntries")}
          </h2>
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
            {todayEntries.length} entry{todayEntries.length !== 1 ? "s" : ""} {locale === "th" ? "· กิจกรรม" : ""}
          </span>
        </div>

        {/* Day axis */}
        <div className="card" style={{ padding: "16px 20px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--ink-3)", fontWeight: 700, marginBottom: 8 }}>
            {["6:00","9:00","12:00","15:00","18:00","21:00"].map(tt => <span key={tt}>{tt}</span>)}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--purple)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "var(--purple)", padding: "1px 8px", borderRadius: 100 }}>
                {locale === "th" ? "ตอนนี้" : "Now"}
              </span>
            </span>
          </div>
          <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 100, position: "relative" }}>
            {todayEntries.slice(0, 5).map((e, i) => {
              const h = new Date(e.createdAt).getHours();
              const p = Math.min(92, Math.max(3, ((h - 6) / 15) * 100));
              const mood = DEFAULT_MOODS.find(m => m.id === e.moodTypeId);
              return (
                <div key={i} style={{ position: "absolute", left: `${p}%`, top: -6, width: 16, height: 16, borderRadius: "50%", background: mood?.color ?? "var(--ink-3)", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,.15)", transform: "translateX(-50%)" }} />
              );
            })}
          </div>
        </div>

        {/* Entries grid (3-col desktop, scroll mobile) */}
        {entries === null ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="entries-feed">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card" style={{ height: 140, opacity: 0.5 }} />
            ))}
          </div>
        ) : todayEntries.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="entries-feed">
            {todayEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} locale={locale} blur={hidePreview} pack={pack} iconFormat={iconFormat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10" style={{ color: "var(--ink-3)", fontSize: 15 }}>
            {t("emptyTitle")}
          </div>
        )}
      </section>

      </div>{/* end left column */}

      {/* ── RIGHT COLUMN (sidebar) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* AI weekly summary (dark card) */}
        <AiSidebarCard tier={tier} locale={locale} />

        {/* Streak */}
        <div className="card" style={{ padding: 20 }}>
          <div className="w-eyebrow" style={{ marginBottom: 10 }}>STREAK</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em" }}>{streak}</span>
            <span style={{ color: "var(--ink-3)", fontSize: 14 }}>{locale === "th" ? "วันติดต่อกัน" : "consecutive days"}</span>
            <span style={{ marginLeft: "auto", fontSize: 28 }}>🔥</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 24, borderRadius: 4, background: i < streak ? "var(--peach)" : "var(--surface-2)" }} />
            ))}
          </div>
        </div>

        {/* Mini calendar */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {new Date().toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long", year: "numeric" })}
            </span>
            <Link href={"/calendar" as "/"} style={{ fontSize: 14, color: "var(--purple-strong)", textDecoration: "none", fontWeight: 700 }}>
              {locale === "th" ? "ดูทั้งหมด →" : "View all →"}
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {(locale === "th" ? ["อา","จ","อ","พ","พฤ","ศ","ส"] : ["Su","Mo","Tu","We","Th","Fr","Sa"]).map(d => (
              <div key={d} style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", textAlign: "center" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: 35 }).map((_, i) => {
              const today = new Date().getDate();
              const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
              const d = i - firstDay + 1;
              const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
              if (d < 1 || d > daysInMonth) return <div key={i} />;
              const filled = d <= today;
              const palette = ["var(--peach)", "var(--yellow)", "var(--mint)", "var(--lavender)", "var(--blue)", "var(--purple)"];
              const c = filled ? palette[(d * 3) % palette.length] : "transparent";
              return (
                <div key={i} style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: filled ? c : "var(--surface-2)",
                  border: d === today ? "2px solid var(--ink)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: filled ? "#fff" : "var(--ink-3)",
                }}>{d}</div>
              );
            })}
          </div>
        </div>
      </div>{/* end right column */}

      </div>{/* end home-grid */}

      {/* ── SMART LOG MODAL ─── */}
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
      {/* ── TOAST ─── */}
      {toast && (
        <div
          className="fixed left-1/2 pop"
          style={{
            top: 24,
            transform: "translateX(-50%)",
            background: "#0A0A0A",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 700,
            zIndex: 60,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

function AiSidebarCard({ tier, locale }: { tier: Tier; locale: string }) {
  const [insight, setInsight] = useState<{ headline: string; summary: string } | null>(null);

  useEffect(() => {
    if (tier !== "premium") return;
    fetch(`/api/insights?locale=${locale}&cacheOnly=1`)
      .then((r) => r.ok ? r.json() as Promise<Record<string, unknown>> : null)
      .then((json) => {
        if (!json || json.empty || json.tooFewEntries) return;
        setInsight({ headline: json.headline as string, summary: json.summary as string });
      })
      .catch(() => {});
  }, [locale, tier]);

  return (
    <div className="card" style={{ padding: 20, background: "linear-gradient(155deg, #1A1320 0%, #2A1F33 100%)", color: "#fff", border: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#FFC899" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#FFC899", letterSpacing: ".05em" }}>AI · {locale === "th" ? "สัปดาห์นี้" : "This week"}</span>
        {tier !== "premium" && (
          <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#FFC899", padding: "2px 8px", borderRadius: 50 }}>PRO</span>
        )}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,.92)" }}>
        {insight && tier === "premium" ? (
          <span style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{insight.summary}</span>
        ) : insight ? (
          <span>{insight.headline}</span>
        ) : (
          locale === "th"
            ? "AI สรุปอารมณ์ประจำสัปดาห์ วิเคราะห์ pattern และแนะนำสิ่งที่ช่วยให้ดีขึ้น"
            : "Weekly mood summary, pattern analysis, and personalized suggestions"
        )}
      </div>
      <Link
        href={(tier === "premium" ? "/insights" : "/pricing") as "/"}
        style={{ marginTop: 14, display: "inline-block", background: "rgba(255,255,255,.1)", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 100, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
      >
        {tier === "premium"
          ? (locale === "th" ? "เปิด AI Insights →" : "Open AI Insights →")
          : (locale === "th" ? "อัปเกรด Pro →" : "Upgrade to Pro →")}
      </Link>
    </div>
  );
}

function EntryCard({ entry, locale, blur, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: { entry: Entry; locale: string; blur?: boolean; pack?: string; iconFormat?: string }) {
  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const date = new Date(entry.createdAt);
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <Link
      href={`/entry/${entry.id}` as "/"}
      className="block transition active:scale-[0.97] card"
      style={{
        padding: 16,
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: mood?.color ?? "#F4F2F7",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {mood ? <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={24} height={24} /> : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
            {locale === "th" ? mood?.labelTh : mood?.label}
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{time}</div>
        </div>
        <span style={{ fontSize: 18, color: "var(--ink-3)", letterSpacing: 1, flexShrink: 0, lineHeight: 1 }}>⋯</span>
      </div>
      {entry.note && (
        <p className="line-clamp-2" style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, margin: 0, filter: blur ? "blur(6px)" : "none", userSelect: blur ? "none" : "auto" }}>
          {entry.note}
        </p>
      )}
      {entry.imageUrl && (
        <img src={entry.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }} />
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, filter: blur ? "blur(6px)" : "none", userSelect: blur ? "none" : "auto" }}>
          {entry.tags.slice(0, 3).map((tag, j) => (
            <span
              key={j}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink-2)",
                background: "var(--surface-2)",
                borderRadius: 8,
                padding: "2px 10px",
              }}
            >
              # {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

