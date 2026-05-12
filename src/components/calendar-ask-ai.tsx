"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Tier } from "@/lib/tier";
import type { AskAiResult } from "@/db/schema";

interface Props {
  tier: Tier;
  year: number;
  month: number;
  onDateSelect?: (date: string) => void;
  initialQuery?: string;
}

const PLACEHOLDERS_EN = [
  "When was I happiest with friends?",
  "Show me rainy days",
  "Which weeks felt heaviest?",
  "What makes Fridays better?",
];
const PLACEHOLDERS_TH = [
  "วันไหนมีความสุขกับเพื่อนที่สุด?",
  "วันฝนตกเป็นยังไงบ้าง?",
  "สัปดาห์ไหนหนักที่สุด?",
  "อะไรทำให้วันศุกร์ดีขึ้น?",
];

export function AskAiBar({ tier, year, month, onDateSelect, initialQuery }: Props) {
  const locale = useLocale();
  const t = useTranslations("calendarAi");
  const isPremium = tier === "premium";

  const ASK_LIMIT = 5;
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskAiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [askCount, setAskCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cooldownInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const placeholders = locale === "th" ? PLACEHOLDERS_TH : PLACEHOLDERS_EN;

  useEffect(() => {
    if (expanded) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [expanded, placeholders.length]);

  useEffect(() => {
    setResult(null);
    setError(null);
    setQuery("");
    setExpanded(false);
  }, [year, month]);

  useEffect(() => {
    if (initialQuery && isPremium) {
      setExpanded(true);
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [initialQuery, isPremium]);

  function showToast(msg: string) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit() {
    if (!query.trim() || loading || cooldown || rateLimited) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/calendar/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: query.trim(), year, month: month + 1, locale }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
        if (j.error === "rate_limited") {
          setRateLimited(true);
          const retrySec = j.retryAfterSec ?? 1800;
          showToast(t("askRateLimited"));
          setTimeout(() => setRateLimited(false), retrySec * 1000);
        } else {
          setError(locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again.");
        }
        return;
      }
      const data = (await res.json()) as AskAiResult;
      setResult(data);
    } catch {
      setError(locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
      if (!rateLimited) {
        setAskCount((c) => c + 1);
        setCooldown(true);
        setCooldownSec(30);
        clearTimeout(cooldownTimer.current);
        clearInterval(cooldownInterval.current);
        cooldownInterval.current = setInterval(() => {
          setCooldownSec((s) => {
            if (s <= 1) { clearInterval(cooldownInterval.current); return 0; }
            return s - 1;
          });
        }, 1000);
        cooldownTimer.current = setTimeout(() => { setCooldown(false); setCooldownSec(0); }, 30000);
      }
    }
  }

  const sparkle = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor" />
    </svg>
  );

  if (!isPremium) {
    return (
      <div className="mt-6 mb-4 fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#A673F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.3px" }}>
          {locale === "th" ? "ถาม AI เกี่ยวกับเดือนนี้" : "Ask AI about this month"}
        </span>
      </div>
      <a
        href="/pricing"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderRadius: 16,
          background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 100%)",
          textDecoration: "none",
          transition: "transform 120ms",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "linear-gradient(135deg, #A673F1, #C49BF7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", flexShrink: 0,
        }}>
          {sparkle}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            {locale === "th" ? "ถาม AI เกี่ยวกับเดือนนี้" : "Ask AI about this month"}
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 1 }}>
            {t("askLocked")}
          </div>
        </div>
        <span style={{
          background: "var(--ink)", color: "#fff",
          fontSize: 9, fontWeight: 800,
          padding: "2px 6px", borderRadius: 4, letterSpacing: "0.3px",
          flexShrink: 0,
        }}>PRO</span>
      </a>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-4 fade-in">
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#A673F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#7A4DD0", letterSpacing: "0.3px" }}>
          {locale === "th" ? "ถาม AI เกี่ยวกับเดือนนี้" : "Ask AI about this month"}
        </span>
      </div>

      {/* Input bar */}
      <div
        onClick={() => {
          if (!expanded) {
            setExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        style={{
          borderRadius: 16,
          padding: "10px 12px 10px 18px",
          background: "#fff",
          border: "1.5px solid var(--hairline)",
          boxShadow: expanded ? "0 4px 20px -4px rgba(166,115,241,.15)" : "0 2px 8px -2px rgba(0,0,0,.04)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: expanded ? "default" : "pointer",
          transition: "box-shadow 200ms, border-color 200ms",
          ...(expanded ? { borderColor: "#D4BEE4" } : {}),
        }}
      >
        {expanded ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex items-center gap-2 flex-1"
          >
            <span style={{ color: "#A673F1", flexShrink: 0, display: "flex" }}>{sparkle}</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholders[placeholderIdx]}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={loading || cooldown || rateLimited || !query.trim()}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: loading || !query.trim() ? "var(--surface-2)" : "linear-gradient(135deg, #A673F1, #C49BF7)",
                border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: loading || !query.trim() ? "var(--ink-3)" : "#fff",
                flexShrink: 0, cursor: "pointer",
                transition: "background 200ms",
              }}
            >
              {loading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ai-spin">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>
        ) : (
          <>
            <span style={{ color: "#A673F1", flexShrink: 0, display: "flex" }}>{sparkle}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {placeholders[placeholderIdx]}
            </span>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ink-3)", flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Usage counter + cooldown */}
      {expanded && (askCount > 0 || cooldown) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 14, color: "var(--ink-3)" }}>
          <span>{locale === "th" ? `ใช้ไป ${askCount} / ${ASK_LIMIT} ครั้ง` : `Used ${askCount} / ${ASK_LIMIT}`}</span>
          {cooldown && cooldownSec > 0 && (
            <span style={{ color: "var(--purple)", fontWeight: 600 }}>
              · {locale === "th" ? `ถามได้อีกใน ${cooldownSec} วิ` : `Ask again in ${cooldownSec}s`}
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 fade-in" style={{ fontSize: 14, fontWeight: 600, color: "#D14343" }}>
          {error}
        </div>
      )}

      {/* Rate limited banner */}
      {rateLimited && (
        <div
          className="mt-3 fade-in"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            fontSize: 14,
            fontWeight: 600,
            color: "#D14343",
          }}
        >
          {t("askRateLimited")}
        </div>
      )}

      {/* Result */}
      {result && result.answer && (
        <div
          className="mt-3 fade-in card"
          style={{ padding: "14px 16px" }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)", marginBottom: result.matchingDates.length > 0 ? 8 : 0 }}>
            {result.answer}
          </p>
          {result.matchingDates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.matchingDates.map((date) => (
                <button
                  key={date}
                  onClick={() => onDateSelect?.(date)}
                  style={{
                    background: "#FAF7FE",
                    border: "1px solid #E6DBF7",
                    borderRadius: 100,
                    padding: "4px 10px",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#A673F1",
                    cursor: "pointer",
                  }}
                >
                  {formatDate(date)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
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
    </div>
  );
}

function formatDate(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
