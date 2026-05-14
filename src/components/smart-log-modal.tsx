"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl, R2_PUBLIC_URL } from "@/lib/moods";
import { optimizeImage } from "@/lib/client-image";
import { VoiceButton } from "./voice-button";
import { trackMoodLog, trackAiAnalyze, trackVoiceInput } from "@/lib/analytics";

type Tier = "guest" | "free" | "premium";

interface AiSuggestion {
  suggestedMoodId: string;
  sentiment: number | null;
  tags: string[];
  imageKey: string | null;
  aiSource: "manual" | "nlp" | "vision" | "nlp+vision";
  aiSummary: string | null;
}

interface RateLimitInfo {
  used: number;
  limit: number;
  retryAfterSec: number;
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

function formatCountdown(sec: number, locale: string) {
  const h = Math.floor(sec / 3600);
  const m = Math.ceil((sec % 3600) / 60);
  if (locale === "th") {
    return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`;
  }
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
  const [aiStep, setAiStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [aiLimit, setAiLimit] = useState<number | null>(null);

  useEffect(() => {
    if (!analyzing) { setAiStep(0); return; }
    const t1 = setTimeout(() => setAiStep(1), 1000);
    const t2 = setTimeout(() => setAiStep(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [analyzing]);

  useEffect(() => {
    fetch("/api/ai/remaining")
      .then((r) => r.json())
      .then((d: unknown) => {
        const j = d as { remaining?: number; limit?: number; tier?: string };
        if (j.remaining !== undefined && j.limit !== undefined) {
          setAiRemaining(j.remaining);
          setAiLimit(j.limit);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!rateLimitInfo) return;
    setCountdown(rateLimitInfo.retryAfterSec);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [rateLimitInfo]);

  const allMoods = [
    ...DEFAULT_MOODS.map((m) => ({ ...m, iconKey: null as string | null })),
    ...customMoods,
  ];
  const selectedMood = allMoods.find((m) => m.id === moodId);
  const hasInput = text.trim().length > 0 || !!imageFile;

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
    trackAiAnalyze(imageFile ? "vision" : "nlp");
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
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          retryAfterSec?: number;
          used?: number;
          limit?: number;
        };
        if (j.error === "rate_limited") {
          setRateLimitInfo({
            used: j.used ?? j.limit ?? 0,
            limit: j.limit ?? 0,
            retryAfterSec: j.retryAfterSec ?? 300,
          });
        } else {
          setError(j.error ?? "error");
        }
        return;
      }
      const s = (await res.json()) as AiSuggestion;
      setSuggestion(s);
      setMoodId(s.suggestedMoodId);
      setTags(s.tags);
      if (aiRemaining !== null && aiRemaining > 0) setAiRemaining(aiRemaining - 1);
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
      trackMoodLog(suggestion ? "smart_log" : "quick");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 fade-in" style={{ background: "rgba(26,19,32,.55)", backdropFilter: "blur(8px)" }}>
      <div
        className="flex flex-col mx-auto w-full"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: 720,
          width: "calc(100% - 32px)",
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 22,
          boxShadow: "0 40px 80px -20px rgba(0,0,0,.4)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between" style={{ padding: "22px 28px", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="var(--purple-strong)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>
              {locale === "th" ? "บันทึกด้วย AI" : "Smart Log AI"}
            </span>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="var(--ink-2)" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: 28, overflowY: "auto" }}>

          {/* ══ RATE LIMIT UI ══ */}
          {rateLimitInfo ? (
            <div className="fade-in" style={{ textAlign: "center", padding: "24px 8px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
                {locale === "th" ? "ขอเบรกแป๊บนะ" : "Take a short break"}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 20px" }}>
                {tier === "premium" ? (
                  locale === "th"
                    ? <>คุณใช้ Smart Log AI ครบ <b>3 ครั้ง / 5 นาที</b> แล้ว — รอสักครู่แล้วลองใหม่</>
                    : <>You&apos;ve used Smart Log AI <b>3 times / 5 min</b> — wait a moment and try again</>
                ) : (
                  locale === "th"
                    ? <>คุณใช้ Smart Log AI ครบ <b>{rateLimitInfo.limit} ครั้ง / วัน</b> (Free) แล้ว — รีเซ็ตเที่ยงคืน หรืออัพเป็น Premium ใช้ไม่จำกัด</>
                    : <>You&apos;ve used all <b>{rateLimitInfo.limit} daily</b> Smart Log AI (Free) — resets at midnight, or upgrade to Premium for unlimited</>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ background: "var(--surface-2)", borderRadius: 14, padding: "14px 18px", maxWidth: 380, margin: "0 auto 24px", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>
                  <span>{locale === "th" ? "วันนี้ใช้ไปแล้ว" : "Used today"}</span>
                  <span style={{ color: "var(--ink)" }}>{rateLimitInfo.used} / {rateLimitInfo.limit}</span>
                </div>
                <div style={{ height: 8, borderRadius: 100, background: "#E8E4EC", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 100, background: "linear-gradient(90deg, #A673F1, #FCA45B)", width: `${Math.min(100, (rateLimitInfo.used / rateLimitInfo.limit) * 100)}%`, transition: "width 0.4s ease" }} />
                </div>
                {countdown > 0 && (
                  <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 6 }}>
                    {locale === "th" ? `รีเซ็ตในอีก ${formatCountdown(countdown, locale)}` : `Resets in ${formatCountdown(countdown, locale)}`}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {tier !== "premium" && (
                  <a href="/pricing" className="w-btn w-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" /></svg>
                    {locale === "th" ? "อัพเป็น Premium" : "Upgrade to Premium"}
                  </a>
                )}
                <button onClick={handleSave} disabled={busy} className="w-btn w-btn-ghost">
                  {busy ? (locale === "th" ? "กำลังบันทึก..." : "Saving...") : (locale === "th" ? "บันทึกแบบปกติ" : "Save without AI")}
                </button>
              </div>
            </div>

          ) : (
            /* ══ NORMAL FORM ══ */
            <>
              {/* Textarea */}
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); if (suggestion) setSuggestion(null); }}
                className="w-textarea"
                placeholder={locale === "th" ? "วันนี้รู้สึกยังไง พิมพ์เหมือนคุยกับเพื่อน..." : "How are you feeling? Write like you're talking to a friend..."}
                style={{ minHeight: 130, fontSize: 16, lineHeight: 1.6 }}
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="relative mt-3">
                  <img src={imagePreview} alt="" className="w-full max-h-40 object-cover" style={{ borderRadius: 12 }} />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,.5)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              )}

              {/* Mic + Image buttons + AI count */}
              <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
                <VoiceButton onTranscript={(s) => { trackVoiceInput(); setText((p) => (p ? p + " " : "") + s); }} />
                <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 100, border: "1px solid var(--hairline)", background: "#fff", cursor: tier === "premium" ? "pointer" : "default", fontWeight: 600, fontSize: 14, opacity: tier === "premium" ? 1 : 0.45, position: "relative" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 17a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>{locale === "th" ? "รูป" : "Photo"}</span>
                  {tier !== "premium" && <span style={{ position: "absolute", top: -6, right: -4, background: "var(--ink)", color: "#fff", fontSize: 14, fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>PRO</span>}
                  {tier === "premium" && <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />}
                </label>
                {aiLimit !== null && aiRemaining !== null && (
                  <span style={{ fontSize: 14, color: "var(--ink-3)", marginLeft: "auto" }}>
                    {locale === "th" ? `เหลือ AI วันนี้ ${aiRemaining} / ${aiLimit}` : `AI remaining ${aiRemaining} / ${aiLimit}`}
                  </span>
                )}
              </div>

              {/* Error (non-rate-limit) */}
              {error && (
                <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "#FEF0F0", border: "1px solid #F5D0D0" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#D14343", margin: 0 }}>
                    {t(`err.${error}` as never) || (locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong.")}
                  </p>
                </div>
              )}

              {/* AI analyzing state */}
              {analyzing && (
                <div className="fade-in" style={{ marginTop: 24, textAlign: "center", padding: "32px 20px" }}>
                  {/* Spinning ring + brain */}
                  <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 20px" }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: "absolute", top: 0, left: 0 }}>
                      <circle cx="50" cy="50" r="44" fill="none" stroke="#E8E4EC" strokeWidth="4" />
                    </svg>
                    <svg width="100" height="100" viewBox="0 0 100 100" className="ai-spin" style={{ position: "absolute", top: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#A673F1" />
                          <stop offset="100%" stopColor="#FCA45B" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ai-grad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="184 276" />
                    </svg>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 36, lineHeight: 1 }}>🧠</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
                    {locale === "th" ? "AI กำลังวิเคราะห์..." : "AI analyzing..."}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 16 }}>
                    {locale === "th" ? "กำลังอ่านข้อความและจับ trigger — ใช้เวลาประมาณ 2-3 วินาที" : "Reading your text and detecting triggers — about 2-3 seconds"}
                  </div>
                  {/* Step indicators */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: aiStep >= 1 ? "#34A853" : "var(--purple)" }}>
                      {aiStep >= 1 ? "✓" : "●"} {locale === "th" ? "ตรวจอารมณ์" : "Mood check"}
                    </span>
                    <span style={{ color: aiStep >= 2 ? "#34A853" : aiStep >= 1 ? "var(--purple)" : "var(--ink-3)" }}>
                      {aiStep >= 2 ? "✓" : aiStep >= 1 ? "●" : "○"} {locale === "th" ? "จับ trigger" : "Triggers"}
                    </span>
                    <span style={{ color: aiStep >= 2 ? "var(--purple)" : "var(--ink-3)" }}>
                      {aiStep >= 2 ? "●" : "○"} {locale === "th" ? "สรุปสั้น" : "Summary"}
                    </span>
                  </div>
                </div>
              )}

              {/* AI suggestion result */}
              {suggestion && !analyzing && (
                <div style={{ marginTop: 24, padding: 18, borderRadius: 14, background: "linear-gradient(135deg, #F8EDEB 0%, #E9DEF6 100%)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="var(--purple-strong)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", letterSpacing: ".03em" }}>{locale === "th" ? "AI วิเคราะห์ให้" : "AI ANALYSIS"}</span>
                    <span style={{ fontSize: 14, color: "var(--ink-3)" }}>· {locale === "th" ? "แก้ไขได้" : "editable"}</span>
                  </div>
                  {/* Mood picker */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>{locale === "th" ? "อารมณ์:" : "Mood:"}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {allMoods.slice(0, 7).map((m) => (
                        <button key={m.id} onClick={() => setMoodId(m.id)} style={{ width: 36, height: 36, borderRadius: "50%", background: m.id === moodId ? (selectedMood?.color ?? "var(--purple)") : "transparent", border: m.id === moodId ? "2px solid var(--ink)" : "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <img src={iconSrc(m)} alt="" width={24} height={24} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Tags */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)", minWidth: 50 }}>{locale === "th" ? "แท็ก:" : "Tags:"}</span>
                    {tags.map((tag, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 100, background: "#fff", color: "var(--ink)", border: "1px solid var(--hairline)", fontSize: 14, fontWeight: 600 }}>
                        #{tag}
                        <button onClick={() => setTags((p) => p.filter((_, j) => j !== i))} style={{ color: "var(--ink-3)", cursor: "pointer", background: "none", border: "none", padding: 0, display: "flex" }}>×</button>
                      </span>
                    ))}
                    <form onSubmit={(e) => { e.preventDefault(); addTag(); }} style={{ display: "inline-flex" }}>
                      <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder={locale === "th" ? "+ เพิ่ม" : "+ Add"} style={{ width: tagInput ? 100 : 60, padding: "4px 10px", borderRadius: 100, background: "transparent", border: "1px dashed var(--hairline-2)", color: "var(--ink-3)", fontFamily: "inherit", fontSize: 14, outline: "none" }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                    </form>
                  </div>
                  {/* Summary */}
                  {suggestion.aiSummary && (
                    <div style={{ padding: 12, background: "rgba(255,255,255,.6)", borderRadius: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", letterSpacing: ".03em", marginBottom: 6 }}>{locale === "th" ? "สรุป" : "Summary"}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }} dangerouslySetInnerHTML={{ __html: suggestion.aiSummary.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
                    </div>
                  )}
                </div>
              )}

              {/* Pro teaser (no suggestion yet, free user) */}
              {!suggestion && !analyzing && tier !== "premium" && (
                <a href="/pricing" style={{ display: "block", textDecoration: "none", marginTop: 18, background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 100%)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#A673F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" /></svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#A673F1" }}>PRO</span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>
                    {locale === "th" ? "AI อ่านสิ่งที่คุณเขียน แล้วสรุปอารมณ์ แท็ก และ insight ให้อัตโนมัติ" : "AI reads your text and extracts mood, tags, and insights automatically"}
                    {" "}<span style={{ fontWeight: 700, color: "#A673F1" }}>{locale === "th" ? "อัปเกรด →" : "Upgrade →"}</span>
                  </p>
                </a>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                <button onClick={onClose} className="w-btn w-btn-ghost">{locale === "th" ? "ยกเลิก" : "Cancel"}</button>
                {!suggestion && !analyzing && (
                  <button onClick={handleAnalyze} disabled={!hasInput || (aiRemaining !== null && aiRemaining <= 0)} className="w-btn" style={{ background: "#fff", border: "1px solid var(--hairline)", opacity: (!hasInput || (aiRemaining !== null && aiRemaining <= 0)) ? 0.4 : 1 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="var(--purple)" /></svg>
                    {aiRemaining !== null && aiRemaining <= 0 ? (locale === "th" ? "หมดโควต้า" : "Quota reached") : (locale === "th" ? "วิเคราะห์" : "Analyze")}
                  </button>
                )}
                {suggestion && !analyzing && (
                  <button onClick={() => { setSuggestion(null); setTags([]); setMoodId(preSelectedMoodId ?? "neutral"); }} className="w-btn w-btn-ghost">
                    {locale === "th" ? "เขียนเอง" : "Write myself"}
                  </button>
                )}
                <button onClick={handleSave} disabled={busy || analyzing} className="w-btn w-btn-primary" style={{ opacity: busy || analyzing ? 0.4 : 1 }}>
                  {busy ? (locale === "th" ? "กำลังบันทึก..." : "Saving...") : (locale === "th" ? "บันทึก" : "Save")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
