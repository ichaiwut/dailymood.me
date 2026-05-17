"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackInsightsView, trackShareInsight } from "@/lib/analytics";
import type { Tier } from "@/lib/tier";
import { moodIconUrl, DEFAULT_MOOD_PACK } from "@/lib/moods";
import { AiSubTabs } from "./ai-sub-tabs";
import { AiDisclaimer } from "./ai-disclaimer";

function weekKeyForOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${tmp.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/* ── Types ─────────────────────────────────────────────── */

interface Pattern {
  title: string;
  description: string;
  tag: "pattern" | "correlation" | "alert";
  miniVizData?: number[];
}

interface WeeklyData {
  headline: string;
  previewHeadline?: string;
  summary: string;
  patterns: Pattern[];
  suggestion: { title: string; description: string } | null;
  streak: number;
  weekKey: string;
  locked?: boolean;
  tier?: string;
  tooFewEntries?: boolean;
  empty?: boolean;
  stats?: {
    avgMood: number;
    avgMoodDelta: number;
    goodDays: number;
    patternsCount: number;
    wellnessScore: number;
    wellnessDelta: number;
  };
}

interface StatusData {
  ready: boolean;
  entryCount: number;
  aiQuota: { used: number; limit: number } | null;
  tier: string;
}

interface ForecastData {
  predictedMood: string;
  confidence: number;
  reasoning: string;
  factors: { direction: "+" | "-"; label: string }[];
  miniTrend: number[];
  tooFewEntries?: boolean;
  entriesNeeded?: number;
}

interface EnergyData {
  hourly: number[];
  peakHour: number;
  troughHour: number;
  tooFewEntries?: boolean;
}

interface ThemesData {
  themes: { label: string; count: number; color: string }[];
  tooFewEntries?: boolean;
}

interface DnaData {
  archetype: string;
  archetypeIcon: string;
  description: string;
  axes: { bright: number; calm: number; energy: number; social: number; depth: number };
  tooFewEntries?: boolean;
}

/* ── Constants ─────────────────────────────────────────── */

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #F2F0F5",
  borderRadius: 22,
  padding: 20,
};

const TAG_ICON: Record<string, string> = {
  pattern: "📌",
  correlation: "↗",
  alert: "⚠️",
};

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  pattern: { bg: "#FCA45B", color: "#fff" },
  correlation: { bg: "#A673F1", color: "#fff" },
  alert: { bg: "#F26B6B", color: "#fff" },
};

function parseWeekNumber(weekKey: string): number | null {
  const m = weekKey.match(/W(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

/* ── Main Component ────────────────────────────────────── */

export function InsightsShell({ tier = "free" }: { tier?: Tier }) {
  const locale = useLocale();
  const t = useTranslations("insights");

  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<WeeklyData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [energy, setEnergy] = useState<EnergyData | null>(null);
  const [themes, setThemes] = useState<ThemesData | null>(null);
  const [dna, setDna] = useState<DnaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [aiCoach, setAiCoach] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    trackInsightsView();
    if (tier !== "premium") { setLoading(false); return; }

    let alive = true;
    setLoading(true);
    setExpanded(false);

    const wk = weekKeyForOffset(weekOffset);

    fetch(`/api/insights/all?locale=${locale}&week=${wk}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!alive || !d) return;
        const all = d as Record<string, unknown>;
        setData(all as unknown as WeeklyData);
        if (all.status) setStatus(all.status as StatusData);
        if (all.forecast) setForecast(all.forecast as ForecastData);
        if (all.energy) setEnergy(all.energy as EnergyData);
        if (all.themes) setThemes(all.themes as ThemesData);
        if (all.dna) setDna(all.dna as DnaData);
      })
      .catch(() => setError(true))
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [locale, tier, weekOffset]);

  const handleFeedback = useCallback(
    async (reaction: "up" | "down" | "routine") => {
      if (!data?.weekKey || !data.suggestion) return;
      const key = `${data.weekKey}:${reaction}`;
      if (feedbackSent.has(key)) return;
      setFeedbackSent((prev) => new Set(prev).add(key));
      await fetch("/api/insights/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekKey: data.weekKey, suggestionTitle: data.suggestion.title, reaction }),
      }).catch(() => {});
    },
    [data, feedbackSent],
  );

  const handleShare = useCallback(async () => {
    if (!data) return;
    trackShareInsight();
    const text = `${data.headline}\n\n${data.summary}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data]);

  const handleToggle = useCallback(async (field: "aiCoachEnabled" | "weeklyDigestEnabled", value: boolean) => {
    if (field === "aiCoachEnabled") setAiCoach(value);
    else setWeeklyDigest(value);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => {});
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState locale={locale} onRetry={() => window.location.reload()} />;

  const isPremium = tier === "premium";

  if (!isPremium) return <FreeGate locale={locale} />;

  if (!data || data.empty) return <EmptyState locale={locale} />;
  if (data.tooFewEntries) return <TooFewState locale={locale} t={t} />;

  const isLocked = data.locked;
  const weekNum = data.weekKey ? parseWeekNumber(data.weekKey) : null;
  const stats = data.stats;

  return (
    <>
      {/* ── AI Sub-tabs ─── */}
      <AiSubTabs active="insights" locale={locale} />

      {/* ── F1: STATUS BAR ─── */}
      {status && (
        <div className="flex items-center justify-between py-3 fade-in ins-status" style={{ fontSize: 14 }}>
          <div className="flex items-center gap-2">
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: status.ready ? "#F0EAFF" : "#F5F5F5",
              color: status.ready ? "#A673F1" : "var(--ink-3)",
              padding: "4px 12px", borderRadius: 20, fontWeight: 700,
            }}>
              {status.ready && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C4DFF", animation: "pulse 2s infinite" }} />}
              {status.ready ? t("statusReady") : t("statusNeedMore", { count: String(7 - status.entryCount) })}
            </span>
            <span style={{ color: "var(--ink-3)" }}>
              {t("entriesUsed", { count: String(status.entryCount) })}
            </span>
          </div>
          {status.aiQuota && (
            <div className="flex items-center gap-2" style={{ color: "var(--ink-3)" }}>
              <span>Ask AI {status.aiQuota.used}/{status.aiQuota.limit}</span>
              <div style={{ width: 60, height: 4, borderRadius: 2, background: "#F2F0F5", overflow: "hidden" }}>
                <div style={{
                  width: `${(status.aiQuota.used / status.aiQuota.limit) * 100}%`,
                  height: "100%", borderRadius: 2,
                  background: status.aiQuota.used / status.aiQuota.limit > 0.95 ? "#E05A5A" : "#A673F1",
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HEADER + WEEK NAV ─── */}
      <header className="pb-5 fade-in">
        <div className="flex items-start justify-between ins-header">
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#A673F1", letterSpacing: "0.4px" }}>
              ✨ AI INSIGHTS {weekNum != null ? `· ${locale === "th" ? `สัปดาห์ที่ ${weekNum}` : `Week ${weekNum}`}` : ""}
            </span>
            <h1 style={{ fontSize: "clamp(22px, 5vw, 26px)", fontWeight: 800, color: "var(--ink)", margin: "2px 0 0" }}>
              {t("yourWeek")}
            </h1>
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
            <button style={WEEK_NAV_BTN} onClick={() => setWeekOffset((o) => o - 1)}>← {t("prevWeek")}</button>
            {weekOffset < 0 && (
              <button style={WEEK_NAV_BTN} onClick={() => setWeekOffset((o) => o + 1)}>
                {t("nextWeek")} →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── F2: HERO RECAP (2-col: text left, tiles right) ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "40ms" }}>
        <div style={{
          background: "linear-gradient(135deg, #A673F1 0%, #C89BF5 40%, #FCA45B 100%)",
          borderRadius: 28, padding: "28px 24px", color: "#fff", position: "relative", overflow: "hidden",
        }}>
          <div className={`ins-hero-grid ${stats ? "ins-hero-2col" : ""}`}>
            {/* Left: summary + buttons */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, letterSpacing: "0.5px", marginBottom: 12 }}>
                {locale === "th" ? "สรุปสัปดาห์ · เขียนโดย AI" : "Weekly summary · by AI"}
              </div>
              <p
                style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.45, margin: "0 0 20px" }}
                dangerouslySetInnerHTML={{
                  __html: (expanded ? data.summary : data.headline).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />

              {!isLocked && (
                <div className="flex items-center gap-3 flex-wrap">
                  {!expanded && (
                    <button onClick={() => setExpanded(true)} style={HERO_BTN}>
                      {locale === "th" ? "อ่านฉบับเต็ม →" : "Read full →"}
                    </button>
                  )}
                  <button onClick={handleShare} style={HERO_BTN}>
                    {copied ? t("copied") : `📩 ${locale === "th" ? "อีเมล / แชร์" : "Email / Share"}`}
                  </button>
                </div>
              )}

              {isLocked && (
                <a href="/pricing" style={{
                  display: "inline-block", padding: "10px 16px",
                  background: "rgba(255,255,255,0.2)", borderRadius: 14, backdropFilter: "blur(4px)",
                  textAlign: "center", textDecoration: "none", color: "#fff",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{t("locked")}</div>
                  <div style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>{t("lockedBody")}</div>
                </a>
              )}
            </div>

            {/* Right: 2×2 stat tiles */}
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <GlassTile label={locale === "th" ? "คะแนนเฉลี่ย" : "Avg mood"} value={stats.avgMood.toFixed(1)} delta={stats.avgMoodDelta > 0 ? `↑ ${stats.avgMoodDelta}` : stats.avgMoodDelta < 0 ? `↓ ${Math.abs(stats.avgMoodDelta)}` : undefined} />
                <GlassTile label={locale === "th" ? "วันที่ดี" : "Good days"} value={`${stats.goodDays}/7`} delta={stats.goodDays >= 4 ? (locale === "th" ? "มากกว่าก่อน" : "More than before") : undefined} />
                <GlassTile label="PATTERN" value={`${locale === "th" ? "พบ" : "found"} ${stats.patternsCount}`} delta={stats.patternsCount > 0 ? `+${stats.patternsCount} ${locale === "th" ? "ใหม่" : "new"}` : undefined} />
                <GlassTile label="WELLNESS" value={String(stats.wellnessScore)} delta={stats.wellnessDelta > 0 ? `+${stats.wellnessDelta} pts` : undefined} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4-FEATURE GRID ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "80ms" }}>
        <div className="ins-4col">
          {/* Forecast */}
          {isPremium && forecast && !forecast.tooFewEntries ? (
            <div style={CARD}>
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ fontSize: 14 }}>🔮</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#A673F1" }}>{locale === "th" ? "พยากรณ์" : "FORECAST"}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{t("forecastTomorrow")}</div>
              <div className="flex items-center gap-2 mb-2">
                <img src={moodIconUrl(forecast.predictedMood)} alt="" width={28} height={28} style={{ width: 28, height: 28 }} />
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{Math.round(forecast.confidence * 100)}%</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.4, margin: 0 }}>{forecast.reasoning}</p>
              {forecast.factors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
                  {forecast.factors.slice(0, 3).map((f, i) => (
                    <div key={i} style={{ fontSize: 14, color: f.direction === "+" ? "#2DA963" : "#E05A5A" }}>
                      {f.direction === "+" ? "⊕" : "⊖"} {f.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isPremium && !forecast ? (
            <div style={{ ...CARD, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: 24, marginBottom: 6 }}>🔮</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{locale === "th" ? "พยากรณ์" : "Forecast"}</div>
              <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 2 }}>{locale === "th" ? "กำลังวิเคราะห์..." : "Analyzing..."}</div>
            </div>
          ) : (
            <FeatureTeaser icon="🔮" label={t("forecast")} desc={forecast?.tooFewEntries ? t("forecastNeedMore", { count: String(forecast.entriesNeeded ?? 7) }) : t("forecast")} locked={!isPremium} locale={locale} />
          )}

          {/* Mood DNA */}
          {isPremium && dna && !dna.tooFewEntries ? (
            <div style={CARD}>
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ fontSize: 14 }}>🧬</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1B7A5A" }}>MOOD DNA</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
                {dna.archetypeIcon} {dna.archetype}
              </div>
              <RadarChart axes={dna.axes} locale={locale} />
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.3, margin: 0 }}>{dna.description}</p>
            </div>
          ) : (
            <FeatureTeaser icon="🧬" label={t("moodDna")} desc={t("moodDnaDesc")} locked={!isPremium} locale={locale} />
          )}

          {/* Themes */}
          {isPremium && themes && !themes.tooFewEntries && themes.themes.length > 0 ? (
            <div style={CARD}>
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ fontSize: 14 }}>🔁</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#A673F1" }}>{locale === "th" ? "ธีมที่กลับมา" : "THEMES"}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{locale === "th" ? "ที่คุณพูดถึงบ่อย" : "What comes up most"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {themes.themes.slice(0, 5).map((th, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ fontSize: 14 }}>
                    <div style={{ width: 4, height: 16, borderRadius: 2, background: th.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)" }}>{th.label}</span>
                    <span style={{ color: "var(--ink-3)", fontSize: 14 }}>{th.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <FeatureTeaser icon="🔁" label={t("themes")} desc={t("themesDesc")} locked={!isPremium} locale={locale} />
          )}

          {/* Energy Clock */}
          {isPremium && energy && !energy.tooFewEntries ? (
            <div style={CARD}>
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ fontSize: 14 }}>⏰</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#A673F1" }}>ENERGY CLOCK</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
                {locale === "th" ? "รู้สึกดีที่สุด" : "Peak energy"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FCA45B", marginBottom: 8 }}>
                {energy.peakHour}:00 {locale === "th" ? "น." : "h"}
              </div>
              <EnergyBars hourly={energy.hourly} peakHour={energy.peakHour} />
              <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 4 }}>
                {locale === "th" ? `ต่ำสุด ${energy.troughHour}:00 น.` : `Low ${energy.troughHour}:00`}
              </div>
            </div>
          ) : (
            <FeatureTeaser icon="⏰" label={t("energyClock")} desc={t("energyClockDesc")} locked={!isPremium} locale={locale} />
          )}
        </div>
      </section>

      {/* ── F8: 3 PATTERN CARDS ─── */}
      {isLocked ? (
        <>
          <LockedCard icon="🔍" title={locale === "th" ? "แพทเทิร์นอารมณ์" : "Mood patterns"} description={locale === "th" ? "AI จับแพทเทิร์นจากบันทึกของคุณ" : "AI detects mood patterns"} delay="120ms" />
          <LockedCard icon="🔗" title={locale === "th" ? "ความสัมพันธ์" : "Correlations"} description={locale === "th" ? "ดูว่ากิจกรรมไหนส่งผลต่ออารมณ์" : "See what affects your mood"} delay="160ms" />
          <LockedCard icon="💡" title={locale === "th" ? "คำแนะนำ" : "Suggestions"} description={locale === "th" ? "AI แนะนำสิ่งที่น่าลอง" : "AI suggests things to try"} delay="200ms" />
        </>
      ) : (
        <>
          {data.patterns.length > 0 && (
            <section className="mb-5 fade-in" style={{ animationDelay: "120ms" }}>
              <div className="ins-patterns">
                {data.patterns.slice(0, 3).map((p, i) => {
                  const tagStyle = TAG_STYLES[p.tag] ?? TAG_STYLES.pattern;
                  const tagIcon = TAG_ICON[p.tag] ?? "🔍";
                  const hasViz = p.miniVizData && p.miniVizData.length > 1;
                  return (
                    <div key={i} style={{ ...CARD, display: "flex", flexDirection: "column" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span style={{ fontSize: 14 }}>{tagIcon}</span>
                        <span style={{
                          background: tagStyle.bg, color: tagStyle.color,
                          fontSize: 14, fontWeight: 800, padding: "3px 8px",
                          borderRadius: 6, letterSpacing: "0.3px", textTransform: "uppercase",
                        }}>
                          {t(p.tag as "pattern" | "correlation" | "alert")}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: "8px 0 6px" }}>{p.title}</h3>
                      <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0, flex: hasViz ? undefined : 1 }}>{p.description}</p>
                      {hasViz && <div style={{ marginTop: "auto", paddingTop: 16 }}><MoodBarChart data={p.miniVizData!} /></div>}
                      {!hasViz && <ActivityTags description={p.description} />}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── F9a: SUGGESTION ─── */}
          {data.suggestion && (
            <section className="mb-5 fade-in" style={{ animationDelay: "160ms" }}>
              <div style={{ background: "#FFFBF5", border: "1.5px solid #F5E6D0", borderRadius: 22, padding: 20 }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span style={{ fontSize: 14 }}>💡</span>
                  <span style={{
                    background: "#FCA45B", color: "#fff", fontSize: 14, fontWeight: 800,
                    padding: "3px 8px", borderRadius: 6, letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    SUGGESTION
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", margin: "8px 0 6px" }}>{data.suggestion.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 16 }}>{data.suggestion.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <FeedbackPill label={`👍 ${locale === "th" ? "ใช่" : "Yes"}`} active={feedbackSent.has(`${data.weekKey}:up`)} onClick={() => handleFeedback("up")} />
                  <FeedbackPill label={`👎 ${locale === "th" ? "ไม่ตรง" : "Not relevant"}`} active={feedbackSent.has(`${data.weekKey}:down`)} onClick={() => handleFeedback("down")} />
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── F10: FOOTER TOGGLES ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "200ms" }}>
        <div className="ins-toggles">
          <div style={CARD}>
            <div className="flex items-start justify-between">
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{
                    width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, #FCA45B, #A673F1)", fontSize: 16,
                  }}>🤖</span>
                  {!isPremium && <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", background: "#F4EEFB", borderRadius: 6, padding: "2px 6px" }}>PRO</span>}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>{t("aiCoachTitle")}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4, margin: 0 }}>{t("aiCoachDesc")}</p>
              </div>
              <TogglePill enabled={aiCoach} disabled={!isPremium} onChange={(v) => handleToggle("aiCoachEnabled", v)} />
            </div>
          </div>
          <div style={CARD}>
            <div className="flex items-start justify-between">
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{
                    width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#E8FFF5", fontSize: 16,
                  }}>📩</span>
                  {!isPremium && <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", background: "#F4EEFB", borderRadius: 6, padding: "2px 6px" }}>PRO</span>}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>{t("weeklyDigestTitle")}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4, margin: 0 }}>{t("weeklyDigestDesc")}</p>
              </div>
              <TogglePill enabled={weeklyDigest} disabled={!isPremium} onChange={(v) => handleToggle("weeklyDigestEnabled", v)} />
            </div>
          </div>
        </div>
      </section>

      <div style={{ textAlign: "center", padding: "0 16px 16px" }}>
        <AiDisclaimer variant="analysis" />
      </div>
    </>
  );
}

/* ── Hero button style ────────────────────────────────── */

const WEEK_NAV_BTN: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #F2F0F5", borderRadius: 20,
  padding: "6px 14px", fontSize: 14, fontWeight: 700, color: "var(--ink)",
  cursor: "pointer",
};

const HERO_BTN: React.CSSProperties = {
  background: "rgba(255,255,255,0.25)", backdropFilter: "blur(4px)",
  color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)",
  borderRadius: 20, padding: "7px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer",
};

/* ── Glass Tile ───────────────────────────────────────── */

function GlassTile({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)",
      borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.2)",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{value}</div>
      {delta && <div style={{ fontSize: 14, fontWeight: 600, color: "#B8FFD8", marginTop: 2 }}>{delta}</div>}
    </div>
  );
}

/* ── Feature Teaser Card ──────────────────────────────── */

function FeatureTeaser({ icon, label, desc, locked, comingSoon, locale }: {
  icon: string; label: string; desc: string; locked?: boolean; comingSoon?: boolean; locale: string;
}) {
  const inner = (
    <div style={{ ...CARD, height: "100%", display: "flex", flexDirection: "column", opacity: comingSoon ? 0.7 : 1 }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ fontSize: 16 }}>{icon}</span>
        {locked && <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", background: "#F4EEFB", borderRadius: 4, padding: "1px 5px" }}>PRO</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>{label}</div>
      <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4, margin: 0, flex: 1 }}>{desc}</p>
      {comingSoon && (
        <div style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", marginTop: 8 }}>
          {locale === "th" ? "เร็ว ๆ นี้" : "Coming soon"}
        </div>
      )}
    </div>
  );
  if (locked && !comingSoon) {
    return <a href="/pricing" style={{ textDecoration: "none", display: "block" }}>{inner}</a>;
  }
  return inner;
}

/* ── Toggle Pill ──────────────────────────────────────── */

function TogglePill({ enabled, disabled, onChange }: { enabled: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", padding: 2,
        background: disabled ? "#E8E8E8" : enabled ? "#A673F1" : "#D8D5DD",
        cursor: disabled ? "default" : "pointer", flexShrink: 0, marginTop: 4,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: "#fff",
        transform: enabled && !disabled ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }} />
    </button>
  );
}

/* ── Radar Chart (Mood DNA) ────────────────────────────── */

function RadarChart({ axes, locale }: { axes: { bright: number; calm: number; energy: number; social: number; depth: number }; locale: string }) {
  const cx = 60, cy = 55, R = 36;
  const keys: (keyof typeof axes)[] = ["bright", "calm", "energy", "social", "depth"];
  const labels = locale === "th"
    ? ["สดใส", "สงบ", "พลัง", "สังคม", "ลึก"]
    : ["Bright", "Calm", "Energy", "Social", "Depth"];

  const angleFor = (i: number) => (Math.PI * 2 * i) / 5 - Math.PI / 2;

  const pts = keys.map((k, i) => {
    const angle = angleFor(i);
    const r = (axes[k] / 40) * R;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const polygon = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const gridPts = (r: number) => keys.map((_, i) => {
    const angle = angleFor(i);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");

  const labelPos = keys.map((_, i) => {
    const angle = angleFor(i);
    const lr = R + 12;
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle) };
  });

  return (
    <svg viewBox="0 0 120 110" width="100%" style={{ display: "block", margin: "6px 0" }}>
      <polygon points={gridPts(R)} fill="none" stroke="#E8E6EC" strokeWidth={0.5} />
      <polygon points={gridPts(R * 0.5)} fill="none" stroke="#E8E6EC" strokeWidth={0.3} />
      <polygon points={polygon} fill="rgba(133,236,203,0.4)" stroke="#1B7A5A" strokeWidth={1.2} />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.8} fill="#1B7A5A" />)}
      {labelPos.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={7} fontWeight={700} fill="var(--ink-3, #999)">
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

/* ── Energy Clock (24h radial) ─────────────────────────── */

function EnergyBars({ hourly, peakHour }: { hourly: number[]; peakHour: number }) {
  const cx = 60, cy = 60, innerR = 22, maxBarLen = 24;
  const maxVal = Math.max(...hourly.filter((v) => v > 0), 0.01);

  return (
    <svg viewBox="0 0 120 120" width="100%" style={{ display: "block", margin: "4px 0" }}>
      <circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke="#F2F0F5" strokeWidth={0.5} />
      {hourly.map((v, i) => {
        const angle = (Math.PI * 2 * i) / 24 - Math.PI / 2;
        const barLen = v > 0 ? Math.max(3, (v / maxVal) * maxBarLen) : 2;
        const x1 = cx + innerR * Math.cos(angle);
        const y1 = cy + innerR * Math.sin(angle);
        const x2 = cx + (innerR + barLen) * Math.cos(angle);
        const y2 = cy + (innerR + barLen) * Math.sin(angle);
        const isPeak = i === peakHour;
        const color = v >= 0.7 ? "#FCA45B" : v >= 0.4 ? "#FDCB56" : "rgba(252,164,91,0.25)";
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isPeak ? "#FCA45B" : color}
            strokeWidth={3.5} strokeLinecap="round"
            opacity={v > 0 ? 1 : 0.3}
          />
        );
      })}
      {[0, 6, 12, 18].map((h) => {
        const angle = (Math.PI * 2 * h) / 24 - Math.PI / 2;
        const lx = cx + (innerR - 8) * Math.cos(angle);
        const ly = cy + (innerR - 8) * Math.sin(angle);
        return (
          <text key={h} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={6} fontWeight={700} fill="var(--ink-3, #999)">
            {h}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Mood Bar Chart ─────────────────────────────────────── */

function MoodBarChart({ data }: { data: number[] }) {
  const locale = useLocale();
  const H = 56;
  const DAYS_TH = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
  const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = locale === "th" ? DAYS_TH : DAYS_EN;

  function barColor(score: number): string {
    if (score >= 4) return "#85ECCB";
    if (score >= 3) return "#FDCB56";
    return "#FEAD8D";
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: H, overflow: "hidden" }}>
        {data.map((v, i) => {
          const clamped = Math.min(5, Math.max(1, v));
          const h = Math.max(6, (clamped / 5) * H);
          return <div key={i} style={{ flex: 1, height: h, borderRadius: 5, background: barColor(clamped) }} />;
        })}
      </div>
      {data.length <= 7 && (
        <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
          {data.map((_, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>
              {days[i] ?? ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Activity Tags ────────────────────────────────────── */

function ActivityTags({ description }: { description: string }) {
  const hashtags = description.match(/#\S+/g) ?? [];
  const quoted = (description.match(/['']([^'']+)['']|'([^']+)'/g) ?? [])
    .map((q) => q.replace(/[''']/g, ""))
    .filter((q) => q.length > 1 && q.length < 20);
  const all = [...new Set([...hashtags, ...quoted.map((q) => `#${q}`)])].slice(0, 5);
  if (all.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" style={{ marginTop: 12 }}>
      {all.map((tag, i) => (
        <span key={i} style={{ background: "#FFF3E6", color: "#E08A2B", fontSize: 14, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>
          {tag}
        </span>
      ))}
    </div>
  );
}

/* ── Feedback Pill ─────────────────────────────────────── */

function FeedbackPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      style={{
        background: active ? "#F0EAFF" : "#fff",
        color: active ? "#A673F1" : "var(--ink-2, #666)",
        border: `1.5px solid ${active ? "#A673F1" : "#F2F0F5"}`,
        borderRadius: 20, padding: "7px 14px", fontSize: 14, fontWeight: 700,
        cursor: active ? "default" : "pointer", transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

/* ── Locked Card ──────────────────────────────────────── */

function LockedCard({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: string }) {
  const locale = useLocale();
  return (
    <section className="mb-4 fade-in" style={{ animationDelay: delay }}>
      <a href="/pricing" style={{ textDecoration: "none", display: "block" }}>
        <div style={{ background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 100%)", borderRadius: 22, padding: 20 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", background: "#F4EEFB", borderRadius: 6, padding: "2px 6px" }}>PRO</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>{title}</h3>
          <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.5, marginBottom: 8 }}>{description}</p>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1" }}>
            {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
          </span>
        </div>
      </a>
    </section>
  );
}

/* ── States ────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="space-y-4 fade-in" style={{ paddingTop: 60 }}>
      <div style={{ height: 20, width: 200, borderRadius: 10, background: "#F0EAFF", opacity: 0.6 }} />
      <div style={{ height: 240, borderRadius: 28, background: "linear-gradient(135deg, #E8DDF5, #F4EEFB)", opacity: 0.5 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 120, borderRadius: 22, background: "var(--surface-2)", opacity: 0.4 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ height: 180, borderRadius: 22, background: "var(--surface-2)", opacity: 0.3 }} />)}
      </div>
    </div>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="text-center py-16 fade-in">
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
        {locale === "th" ? "ยังไม่มีข้อมูลเพียงพอ" : "Not enough data yet"}
      </h2>
      <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.5 }}>
        {locale === "th" ? "บันทึกอารมณ์สักไม่กี่วัน แล้ว AI จะวิเคราะห์ให้" : "Log moods for a few days and AI will analyze your patterns."}
      </p>
    </div>
  );
}

function TooFewState({ locale, t }: { locale: string; t: (key: string) => string }) {
  return (
    <div className="text-center py-16 fade-in">
      <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
        {locale === "th" ? "เกือบถึงแล้ว!" : "Almost there!"}
      </h2>
      <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.5 }}>{t("tooFewEntries")}</p>
    </div>
  );
}

function ErrorState({ locale, onRetry }: { locale: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16 fade-in">
      <div style={{ fontSize: 48, marginBottom: 12 }}>😵</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
        {locale === "th" ? "เกิดข้อผิดพลาด" : "Something went wrong"}
      </h2>
      <button
        onClick={onRetry}
        style={{ marginTop: 12, background: "#A673F1", color: "#fff", border: "none", borderRadius: 100, padding: "10px 24px", fontSize: 14, fontWeight: 700 }}
      >
        {locale === "th" ? "ลองใหม่" : "Try again"}
      </button>
    </div>
  );
}

function FreeGate({ locale }: { locale: string }) {
  const isTh = locale === "th";

  const handleCheckout = async () => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "monthly" }),
    });
    const json = (await res.json()) as { url?: string };
    if (json.url) globalThis.location.assign(json.url);
  };

  return (
    <div className="fade-in">
      <AiSubTabs active="insights" locale={locale} />

      <div style={{ fontSize: 14, fontWeight: 800, color: "#A673F1", letterSpacing: 0.4, marginBottom: 4 }}>
        AI INSIGHTS
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", margin: "0 0 24px" }}>
        {isTh ? "เปิดมุมมองที่ลึกขึ้น" : "Unlock deeper insights"}
      </h1>

      <div className="ins-free-gate">
        {/* Left: blurred preview */}
        <div>
          <div style={{
            background: "#fff", borderRadius: 22, padding: 20,
            border: "1.5px solid #F2F0F5", marginBottom: 14,
            filter: "blur(4px)", opacity: 0.6, pointerEvents: "none",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
              {isTh ? "สรุปสัปดาห์" : "Weekly summary"}
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
              {isTh ? "สัปดาห์นี้ คุณรู้สึก..." : "This week, you felt..."}
            </div>
          </div>
          <div style={{
            background: "#fff", borderRadius: 22, padding: 20, height: 200,
            border: "1.5px solid #F2F0F5",
            filter: "blur(4px)", opacity: 0.6, pointerEvents: "none",
          }} />
        </div>

        {/* Right: premium CTA card */}
        <div style={{
          background: "linear-gradient(135deg, #F9A870 0%, #C89BF5 50%, #A673F1 100%)",
          borderRadius: 22, padding: "28px 24px", color: "#fff",
          position: "relative",
        }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>+</div>
          <div style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.2)", borderRadius: 20,
            padding: "4px 12px", fontSize: 14, fontWeight: 700,
          }}>
            ✨ PREMIUM
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>
            {isTh ? "AI Insights รายสัปดาห์" : "Weekly AI Insights"}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.5, marginBottom: 16 }}>
            {isTh
              ? "วิเคราะห์ pattern · เปรียบเทียบสัปดาห์ · ถาม AI ได้ 100 คำถาม/เดือน · ข้อมูลย้อนหลังไม่จำกัด"
              : "Pattern analysis · Weekly comparisons · 100 AI questions/month · Unlimited history"}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            {(isTh ? [
              "Weekly mood report (อีเมล)",
              "Pattern detection อัตโนมัติ",
              "เปรียบเทียบสัปดาห์ / เดือน / ปี",
              "Mood signature ของคุณ",
              "Export ข้อมูลเป็น CSV",
            ] : [
              "Weekly mood report (email)",
              "Automatic pattern detection",
              "Compare week / month / year",
              "Your mood signature",
              "Export data as CSV",
            ]).map((item, i) => (
              <li key={i} style={{ fontSize: 14, opacity: 0.9, paddingLeft: 16, position: "relative" }}>
                <span style={{ position: "absolute", left: 0 }}>•</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={handleCheckout}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 16,
              background: "#fff", border: "none", color: "#A673F1",
              fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 8,
            }}
          >
            ✨ {isTh ? "ทดลองฟรี 7 วัน" : "Start 7-day free trial"}
          </button>
          <div style={{ fontSize: 14, opacity: 0.75, textAlign: "center" }}>
            ฿99/{isTh ? "เดือน" : "month"} · {isTh ? "ยกเลิกเมื่อไหร่ก็ได้" : "Cancel anytime"}
          </div>
        </div>
      </div>
    </div>
  );
}
