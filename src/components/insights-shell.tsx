"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Tier } from "@/lib/tier";

/* ── Types ─────────────────────────────────────────────── */

interface Pattern {
  title: string;
  description: string;
  tag: "pattern" | "correlation" | "alert";
  miniVizData?: number[];
}

interface InsightsData {
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
}

/* ── Constants ─────────────────────────────────────────── */

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #F2F0F5",
  borderRadius: 22,
  padding: 18,
};

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  pattern: { bg: "#FCA45B", color: "#fff" },
  correlation: { bg: "#A673F1", color: "#fff" },
  alert: { bg: "#F26B6B", color: "#fff" },
};

function truncateSummary(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : text.slice(0, 100);
}

/* ── Main Component ────────────────────────────────────── */

export function InsightsShell({ tier = "free" }: { tier?: Tier }) {
  const locale = useLocale();
  const t = useTranslations("insights");

  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    fetch(`/api/insights?locale=${locale}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((json) => {
        if (!alive) return;
        setData(json as InsightsData);
      })
      .catch(() => setError(true))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [locale]);

  const handleFeedback = useCallback(
    async (reaction: "up" | "down" | "routine") => {
      if (!data?.weekKey || !data.suggestion) return;
      const key = `${data.weekKey}:${reaction}`;
      if (feedbackSent.has(key)) return;

      setFeedbackSent((prev) => new Set(prev).add(key));

      await fetch("/api/insights/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekKey: data.weekKey,
          suggestionTitle: data.suggestion.title,
          reaction,
        }),
      }).catch(() => {});
    },
    [data, feedbackSent],
  );

  const handleShare = useCallback(async () => {
    if (!data) return;
    const text = `${data.headline}\n\n${data.summary}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState locale={locale} onRetry={() => window.location.reload()} />;
  if (!data || data.empty) return <EmptyState locale={locale} />;
  if (data.tooFewEntries) return <TooFewState locale={locale} t={t} />;

  const isLocked = data.locked;

  return (
    <>
      {/* ── HEADER ─── */}
      <header className="flex items-center justify-between pt-4 pb-5 fade-in">
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#A673F1", letterSpacing: "0.4px" }}>DAILYMOOD AI</span>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>{t("title")}</h1>
        </div>
        <Link href={"/stats" as "/"} style={{ fontSize: 13, fontWeight: 600, color: "#A673F1", textDecoration: "none" }}>
          {t("backToStats")}
        </Link>
      </header>

      {/* ── HERO SUMMARY CARD ─── */}
      <section className="mb-5 fade-in" style={{ animationDelay: "40ms" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #A673F1 0%, #C89BF5 50%, #FCA45B 100%)",
            borderRadius: 28,
            padding: "24px 22px",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, letterSpacing: "0.5px", marginBottom: 10 }}>
            {t("weeklySummary")}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, marginBottom: 8 }}>{data.headline}</div>
          <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.5 }}>
            {expanded ? data.summary : truncateSummary(data.summary)}
          </p>

          {!isLocked && (
            <div className="flex items-center gap-3 mt-4">
              {!expanded ? (
                <button
                  onClick={() => setExpanded(true)}
                  style={{ background: "rgba(255,255,255,0.25)", color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {t("readFull")} ↗
                </button>
              ) : null}
              <button
                onClick={handleShare}
                style={{ background: "rgba(255,255,255,0.25)", color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {copied ? t("copied") : t("share")}
              </button>
            </div>
          )}

          {isLocked && (
            <a
              href="/pricing"
              style={{
                display: "block", marginTop: 16,
                padding: "10px 16px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: 14,
                backdropFilter: "blur(4px)",
                textAlign: "center",
                textDecoration: "none", color: "#fff",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t("locked")}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{t("lockedBody")}</div>
            </a>
          )}
        </div>
      </section>

      {/* ── PATTERN CARDS ─── */}
      {isLocked ? (
        <>
          <LockedCard icon="🔍" title={locale === "th" ? "แพทเทิร์นอารมณ์" : "Mood patterns"} description={locale === "th" ? "AI จับแพทเทิร์นจากบันทึกของคุณ เช่น อารมณ์ดีขึ้นหลังออกกำลังกาย" : "AI detects patterns like mood improving after exercise"} delay="80ms" />
          <LockedCard icon="🔗" title={locale === "th" ? "ความสัมพันธ์" : "Correlations"} description={locale === "th" ? "ดูว่ากิจกรรมไหนส่งผลต่ออารมณ์คุณจริง ๆ" : "See which activities actually affect your mood"} delay="120ms" />
          <LockedCard icon="💡" title={locale === "th" ? "คำแนะนำประจำสัปดาห์" : "Weekly suggestion"} description={locale === "th" ? "AI แนะนำสิ่งที่น่าลองจากข้อมูลของคุณ" : "AI suggests things to try based on your data"} delay="160ms" />
        </>
      ) : (
        <>
          {data.patterns.map((p, i) => {
            const style = TAG_STYLES[p.tag] ?? TAG_STYLES.pattern;
            return (
              <section key={i} className="mb-4 fade-in" style={{ animationDelay: `${80 + i * 40}ms` }}>
                <div style={CARD}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ background: style.bg, color: style.color, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.3px" }}>
                      {t(p.tag as "pattern" | "correlation" | "alert")}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", margin: "8px 0 4px" }}>{p.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: p.miniVizData && p.miniVizData.length > 1 ? 16 : 0 }}>{p.description}</p>
                  {p.miniVizData && p.miniVizData.length > 1 && <MoodBarChart data={p.miniVizData} />}
                </div>
              </section>
            );
          })}

          {/* ── SUGGESTION CARD ─── */}
          {data.suggestion && (
            <section className="mb-5 fade-in" style={{ animationDelay: "200ms" }}>
              <div style={{ background: "#FAFFF8", border: "1.5px solid #DEF1D5", borderRadius: 22, padding: 18 }}>
                <span style={{ background: "#5CBF5C", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.3px" }}>
                  {t("tryThis")}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", margin: "8px 0 4px" }}>{data.suggestion.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 12 }}>{data.suggestion.description}</p>

                <div className="flex items-center gap-2">
                  <FeedbackPill
                    label={`👍 ${t("thumbUp")}`}
                    active={feedbackSent.has(`${data.weekKey}:up`)}
                    onClick={() => handleFeedback("up")}
                  />
                  <FeedbackPill
                    label={`👎 ${t("thumbDown")}`}
                    active={feedbackSent.has(`${data.weekKey}:down`)}
                    onClick={() => handleFeedback("down")}
                  />
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── STREAK CARD ─── */}
      {data.streak > 0 && (
        <section className="mb-5 fade-in" style={{ animationDelay: "240ms" }}>
          <div
            style={{
              background: "#FAF7FE",
              border: "1.5px solid #E6DBF7",
              borderRadius: 22,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 28 }}>🔥</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
                {data.streak} {t("streak")}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{t("streakTitle")}</div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ── Mood Bar Chart ─────────────────────────────────────── */

function MoodBarChart({ data }: { data: number[] }) {
  const locale = useLocale();
  const H = 56;
  const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DAYS_TH = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
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
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 5,
                background: barColor(clamped),
              }}
            />
          );
        })}
      </div>
      {data.length <= 7 && (
        <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
          {data.map((_, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--ink-3)" }}>
              {days[i] ?? ""}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 8, justifyContent: "center" }}>
        {[
          { color: "#85ECCB", label: locale === "th" ? "ดี" : "Good" },
          { color: "#FDCB56", label: locale === "th" ? "กลางๆ" : "Okay" },
          { color: "#FEAD8D", label: locale === "th" ? "ไม่ค่อยดี" : "Low" },
        ].map((l) => (
          <div key={l.color} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-3)" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feedback Pill ─────────────────────────────────────── */

function LockedCard({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: string }) {
  const locale = useLocale();
  return (
    <section className="mb-4 fade-in" style={{ animationDelay: delay }}>
      <a href="/pricing" style={{ textDecoration: "none", display: "block" }}>
        <div style={{
          background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 100%)",
          borderRadius: 22, padding: 18,
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#A673F1", background: "#F4EEFB", borderRadius: 6, padding: "2px 6px" }}>PRO</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>{title}</h3>
          <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5, marginBottom: 8 }}>{description}</p>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#A673F1" }}>
            {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
          </span>
        </div>
      </a>
    </section>
  );
}

function FeedbackPill({ label, active, accent, onClick }: { label: string; active: boolean; accent?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      style={{
        background: active ? (accent ? "#5CBF5C" : "#F0EAFF") : "#fff",
        color: active ? (accent ? "#fff" : "#A673F1") : "var(--ink-2, #666)",
        border: `1.5px solid ${active ? (accent ? "#5CBF5C" : "#A673F1") : "#F2F0F5"}`,
        borderRadius: 20,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: active ? "default" : "pointer",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

/* ── States ────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="space-y-4 fade-in" style={{ paddingTop: 60 }}>
      <div style={{ height: 180, borderRadius: 28, background: "linear-gradient(135deg, #E8DDF5, #F4EEFB)", opacity: 0.6 }} />
      <div style={{ height: 120, borderRadius: 22, background: "var(--surface-2)", opacity: 0.5 }} />
      <div style={{ height: 120, borderRadius: 22, background: "var(--surface-2)", opacity: 0.4 }} />
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
      <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.5 }}>
        {t("tooFewEntries")}
      </p>
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
