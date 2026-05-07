"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface Pattern {
  title: string;
  description: string;
  tag: "pattern" | "correlation" | "alert";
}

interface InsightsData {
  headline: string;
  summary: string;
  patterns: Pattern[];
  suggestion: { title: string; description: string } | null;
}

const TAG_STYLES: Record<string, { bg: string; color: string; label: { th: string; en: string } }> = {
  pattern:     { bg: "#FCA45B", color: "#fff", label: { th: "แพทเทิร์น", en: "PATTERN" } },
  correlation: { bg: "#A673F1", color: "#fff", label: { th: "ความสัมพันธ์", en: "CORRELATION" } },
  alert:       { bg: "#F26B6B", color: "#fff", label: { th: "แจ้งเตือน", en: "ALERT" } },
};

export function InsightsShell() {
  const locale = useLocale();
  const t = useTranslations("insights");
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/insights?locale=${locale}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((json) => {
        if (json.empty) {
          setData(null);
        } else {
          setData(json as InsightsData);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [locale]);

  return (
    <>
      {/* ── HEADER ─── */}
      <header className="flex items-center justify-between pt-4 pb-5 fade-in">
        <div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#A673F1",
              letterSpacing: "0.4px",
            }}
          >
            DAILYMOOD AI
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
            {t("title")}
          </h1>
        </div>
      </header>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState locale={locale} onRetry={() => window.location.reload()} />
      ) : !data ? (
        <EmptyState locale={locale} />
      ) : (
        <>
          {/* ── HERO CARD — Executive Summary ─── */}
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
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  opacity: 0.85,
                  letterSpacing: "0.5px",
                  marginBottom: 10,
                }}
              >
                {t("weeklySummary")}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, marginBottom: 8 }}>
                {data.headline}
              </div>
              <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.5 }}>
                {data.summary}
              </p>
            </div>
          </section>

          {/* ── PATTERN / CORRELATION CARDS ─── */}
          {data.patterns.map((p, i) => {
            const style = TAG_STYLES[p.tag] ?? TAG_STYLES.pattern;
            return (
              <section key={i} className="mb-4 fade-in" style={{ animationDelay: `${80 + i * 40}ms` }}>
                <div
                  style={{
                    background: "#fff",
                    border: "1.5px solid #F2F0F5",
                    borderRadius: 22,
                    padding: 18,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        background: style.bg,
                        color: style.color,
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 6,
                        letterSpacing: "0.3px",
                      }}
                    >
                      {locale === "th" ? style.label.th : style.label.en}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", margin: "8px 0 4px" }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    {p.description}
                  </p>
                </div>
              </section>
            );
          })}

          {/* ── SUGGESTION CARD ─── */}
          {data.suggestion && (
            <section className="mb-5 fade-in" style={{ animationDelay: "200ms" }}>
              <div
                style={{
                  background: "#FAFFF8",
                  border: "1.5px solid #DEF1D5",
                  borderRadius: 22,
                  padding: 18,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    style={{
                      background: "#5CBF5C",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 6,
                      letterSpacing: "0.3px",
                    }}
                  >
                    {t("tryThis")}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", margin: "8px 0 4px" }}>
                  {data.suggestion.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  {data.suggestion.description}
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 fade-in">
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
        {locale === "th"
          ? "บันทึกอารมณ์สักไม่กี่วัน แล้ว AI จะวิเคราะห์ให้"
          : "Log moods for a few days and AI will analyze your patterns."}
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
        style={{
          marginTop: 12,
          background: "#A673F1",
          color: "#fff",
          border: "none",
          borderRadius: 100,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {locale === "th" ? "ลองใหม่" : "Try again"}
      </button>
    </div>
  );
}
