"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";
import { SmartLogModal } from "./smart-log-modal";
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
    ]).then(([logData, statsData]) => {
      if (!alive) return;
      const allEntries = (logData as { entries: Entry[] }).entries;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      setEntries(allEntries.filter((e) => new Date(e.createdAt) >= sevenDaysAgo));
      setStats(statsData as Stats);
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const streak = stats?.streak ?? 0;

  return (
    <>
      {/* ── AI COMPOSER CARD (inline) ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "40ms" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "20px 18px",
            border: "1.5px solid #F0EAF7",
            boxShadow: "0 10px 30px rgba(166,115,241,0.10)",
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
            <span style={{ fontSize: 13, fontWeight: 700, color: "#A673F1", letterSpacing: "0.3px" }}>
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
            <div className="relative mt-2.5">
              <img src={composerImagePreview} alt="" className="w-full max-h-32 object-cover" style={{ borderRadius: 14 }} />
              <button
                onClick={() => { setComposerImage(null); setComposerImagePreview(null); }}
                className="absolute top-1.5 right-1.5"
                style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Error / Info */}
          {composerError && (
            <div className="mt-2.5" style={{ padding: "10px 14px", borderRadius: 12, background: "#F4EEFB", border: "1px solid #E6DBF7" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#7A4DD0" }}>
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
                <span style={{ fontSize: 11, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.4px" }}>
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
                      fontSize: 12,
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
                <span key={i} className="flex items-center gap-1" style={{ background: "#fff", border: "1.5px solid #F0EAF7", padding: "5px 10px", borderRadius: 100, fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
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
                  fontSize: 8,
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
                fontSize: 9,
                fontWeight: 800,
                flexShrink: 0,
                letterSpacing: "0.3px",
              }}>
                PRO
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.4, color: "#7A4DD0", fontWeight: 600 }}>
                {locale === "th"
                  ? "ใช้ AI ได้วันละครั้ง — อัปเกรด Pro เพื่อใช้ได้ไม่จำกัด"
                  : "1 free AI analysis per day — upgrade to Pro for unlimited"}
              </p>
            </a>
          )}
        </div>
      </section>

      {/* ── MOOD PICKER ROW ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
            {locale === "th" ? "หรือแตะเลือกอารมณ์" : "Or just tap a mood"}
          </h2>
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {stats?.total30d ?? 0} {locale === "th" ? "รายการ" : "logged"}
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-2">
          {DEFAULT_MOODS.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setLogMoodId(m.id)}
              aria-label={locale === "th" ? m.labelTh : m.label}
              className="shrink-0 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
              style={{
                width: 76,
                height: 96,
                background: m.color,
                borderRadius: 22,
                fontWeight: 700,
                color: "#0A0A0A",
                fontSize: 13,
                boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
              }}
            >
              <img src={icon(m.id)} alt="" width={36} height={36} style={{ pointerEvents: "none" }} />
              <span>{locale === "th" ? m.labelTh : m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── STREAK STRIP ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "100ms" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #A673F1 0%, #C89BF5 100%)",
            borderRadius: 24,
            padding: "16px 18px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 14px 30px rgba(166,115,241,0.32)",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🔥
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {locale === "th" ? "Streak ต่อเนื่อง" : "You're on a streak"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15, whiteSpace: "nowrap" }}>
              {streak} {locale === "th" ? "วัน" : "days strong"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 22,
                  borderRadius: 3,
                  background: i < streak % 7 || streak >= 7
                    ? "#fff"
                    : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 7-DAY TIMELINE ─── */}
      <section className="mb-6 fade-in" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
            {locale === "th" ? "7 วันที่ผ่านมา" : "Last 7 days"}
          </h2>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
          {(stats?.last7 ?? Array.from({ length: 7 }, () => null)).map((day, i) => {
            const d = day ? new Date(day.date + "T00:00:00") : null;
            const mood = day?.moodId
              ? DEFAULT_MOODS.find((m) => m.id === day.moodId)
              : null;
            const isToday = d && d.toDateString() === new Date().toDateString();
            const dayName = d
              ? d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "short" })
              : "";
            const dayNum = d ? d.getDate() : "";

            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5"
                style={{ flex: 1, minWidth: 0 }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isToday ? "#A673F1" : "var(--ink-3)",
                  }}
                >
                  {dayName}
                </span>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: mood ? mood.color : "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isToday ? "2px solid #A673F1" : "none",
                  }}
                >
                  {mood ? (
                    <img src={icon(mood.id)} alt="" width={24} height={24} />
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>—</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? "#A673F1" : "var(--ink-3)",
                  }}
                >
                  {dayNum}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── RECENT ENTRIES ─── */}
      <section className="fade-in pb-28" style={{ animationDelay: "140ms" }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
            {t("todayEntries")}
          </h2>
          <span
            style={{ fontSize: 13, color: "#A673F1", fontWeight: 700, cursor: "pointer" }}
          >
            {t("seeAll")} →
          </span>
        </div>

        {entries === null ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="shrink-0"
                style={{
                  width: 200,
                  height: 120,
                  borderRadius: 18,
                  background: "var(--surface-2)",
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} locale={locale} blur={hidePreview} pack={pack} iconFormat={iconFormat} />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-10"
            style={{ color: "var(--ink-3)", fontSize: 15 }}
          >
            {t("emptyTitle")}
          </div>
        )}
      </section>

      {/* ── SMART LOG MODAL ─── */}
      {logMoodId && (
        <SmartLogModal
          tier={tier}
          pack={pack}
          iconFormat={iconFormat}
          preSelectedMoodId={logMoodId}
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

function EntryCard({ entry, locale, blur, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: { entry: Entry; locale: string; blur?: boolean; pack?: string; iconFormat?: string }) {
  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const date = new Date(entry.createdAt);
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const dayLabel = date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/entry/${entry.id}` as "/"}
      className="shrink-0 block transition active:scale-[0.97]"
      style={{
        width: 200,
        background: "#fff",
        borderRadius: 20,
        padding: "14px 16px",
        border: "1.5px solid #F0EAF7",
        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="shrink-0 grid place-items-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: mood?.color ?? "#F4F2F7",
          }}
        >
          {mood ? <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={24} height={24} /> : null}
        </div>
        <div className="min-w-0">
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            {locale === "th" ? mood?.labelTh : mood?.label}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {dayLabel} · {time}
          </div>
        </div>
      </div>
      {entry.note && (
        <p className="line-clamp-2" style={{ fontSize: 12, color: "#5A5A5A", lineHeight: 1.4, filter: blur ? "blur(6px)" : "none", userSelect: blur ? "none" : "auto" }}>
          {entry.note}
        </p>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2" style={{ filter: blur ? "blur(6px)" : "none", userSelect: blur ? "none" : "auto" }}>
          {entry.tags.slice(0, 3).map((tag, j) => (
            <span
              key={j}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#A673F1",
                background: "#F4EEFB",
                borderRadius: 8,
                padding: "1px 6px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

