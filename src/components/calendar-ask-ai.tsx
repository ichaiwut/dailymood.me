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

export function AskAiBar({ tier, year, month, onDateSelect }: Props) {
  const locale = useLocale();
  const t = useTranslations("calendarAi");
  const isPremium = tier === "premium";

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskAiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
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
        setCooldown(true);
        clearTimeout(cooldownTimer.current);
        cooldownTimer.current = setTimeout(() => setCooldown(false), 10000);
      }
    }
  }

  if (!isPremium) {
    return (
      <div
        className="mt-6 mb-4 fade-in"
        style={{
          borderRadius: 18,
          padding: "14px 16px",
          background: "#FAF7FE",
          border: "1.5px dashed #D4BEE4",
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: 0.7,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#A673F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", flex: 1 }}>
          {t("askLocked")}
        </span>
        <span
          style={{
            background: "#0A0A0A",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 4,
            letterSpacing: "0.3px",
          }}
        >
          PRO
        </span>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-4 fade-in">
      {/* Input bar */}
      <div
        onClick={() => {
          if (!expanded) {
            setExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        style={{
          borderRadius: 18,
          padding: "12px 14px",
          background: "#FAF7FE",
          border: "1.5px dashed #D4BEE4",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: expanded ? "default" : "pointer",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#A673F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
          </svg>
        </div>
        {expanded ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex items-center gap-2 flex-1"
          >
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
              }}
            />
            <button
              type="submit"
              disabled={loading || cooldown || rateLimited || !query.trim()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "#A673F1",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: loading || !query.trim() ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        ) : (
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)", fontStyle: "italic", flex: 1 }}>
            {t("askLabel")}: &ldquo;{placeholders[placeholderIdx]}&rdquo;
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-3 fade-in" style={{ fontSize: 13, fontWeight: 600, color: "#A673F1" }}>
          <span className="pulse" style={{ display: "inline-block", marginRight: 6 }}>✨</span>
          {t("askLoading")}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 fade-in" style={{ fontSize: 13, fontWeight: 600, color: "#D14343" }}>
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
            fontSize: 13,
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
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)", marginBottom: 8 }}>
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
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#A673F1",
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
