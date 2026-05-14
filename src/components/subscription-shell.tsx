"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { BottomSheet } from "./bottom-sheet";

interface SubData {
  isPremium: boolean;
  hasStripeCustomer: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  planInterval: string | null;
  subscriptionStatus: string | null;
  memberSince: string;
}

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #F2F0F5",
  borderRadius: 22,
  padding: 20,
};

const FEATURES = [
  { icon: "✨", title: "AI ไม่จำกัด", titleEn: "Unlimited AI", desc: "NLP, Vision, Insights — ใช้ได้ทุกวัน", descEn: "NLP, Vision, Insights — unlimited daily" },
  { icon: "🔮", title: "AI Insights + พยากรณ์", titleEn: "AI Insights + Forecast", desc: "สรุปสัปดาห์ แพทเทิร์น Mood DNA พยากรณ์อารมณ์", descEn: "Weekly recap, patterns, Mood DNA, forecast" },
  { icon: "📅", title: "Calendar AI + Ask AI", titleEn: "Calendar AI + Ask AI", desc: "สรุปรายเดือน + ถามอะไรก็ได้จากข้อมูลของคุณ", descEn: "Monthly summaries + ask anything about your data" },
  { icon: "🎨", title: "Custom Moods + Icon Packs", titleEn: "Custom Moods + Icon Packs", desc: "สร้างอารมณ์เอง + เลือก pack ไอคอนพิเศษ", descEn: "Create your own moods + premium icon packs" },
  { icon: "📊", title: "Year in Pixels + สถิติปี", titleEn: "Year in Pixels + Yearly Stats", desc: "ดูภาพรวมทั้งปี + Activity Impact เต็ม", descEn: "Full year overview + complete activity impact" },
  { icon: "📤", title: "ส่งออก CSV/JSON/PDF", titleEn: "Export CSV/JSON/PDF", desc: "ข้อมูลของคุณ คุณเป็นเจ้าของ", descEn: "Your data, you own it" },
];

export function SubscriptionShell() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [usage, setUsage] = useState<{ nlp: number; vision: number } | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<SubData>;
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        const profile = p as Record<string, unknown> | null;
        const stats = profile?.stats as Record<string, number> | undefined;
        if (stats) {
          setUsage({ nlp: stats.totalEntries ?? 0, vision: 0 });
        }
      })
      .catch(() => {});
  }, []);

  const openPortal = async () => {
    if (portalLoading) return;
    setPortalLoading(true);
    setPortalError(false);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = (await res.json()) as { url?: string };
      if (json.url) {
        globalThis.location.assign(json.url);
      } else {
        setPortalError(true);
      }
    } catch {
      setPortalError(true);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: "24px 0" }}>
        <div style={{ height: 200, borderRadius: 28, background: "var(--surface-2)", marginBottom: 16 }} className="skeleton-pulse" />
        <div style={{ height: 160, borderRadius: 22, background: "var(--surface)", marginBottom: 16 }} className="skeleton-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fade-in" style={{ padding: "24px 0" }}>
        <TopBar t={t} router={router} />
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-3)", fontSize: 14 }}>
          {locale === "th" ? "ไม่สามารถโหลดข้อมูลได้ ลองใหม่อีกครั้ง" : "Couldn't load subscription info. Try again later."}
        </div>
      </div>
    );
  }

  const renewDate = data.currentPeriodEnd ? formatDate(data.currentPeriodEnd, locale) : null;
  const isYearly = data.planInterval === "year";
  const isCanceling = data.cancelAtPeriodEnd;

  return (
    <div className="fade-in center-880" style={{ paddingBottom: 40 }}>
      <TopBar t={t} router={router} />

      {!data.isPremium ? (
        <FreeState />
      ) : (
        <>
          {/* Title */}
          <div className="fade-in" style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Premium</h1>
            <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
              {locale === "th"
                ? "ใช้ AI ได้ไม่จำกัด · บันทึกย้อนหลังได้ไม่จำกัด · ส่งออกข้อมูลทุกรูปแบบ"
                : "Unlimited AI · Unlimited history · Export in any format"}
            </p>
          </div>

          {/* Dark subscription card */}
          <div
            className="fade-in"
            style={{
              background: "linear-gradient(135deg, #2C2435 0%, #3D2E50 100%)",
              borderRadius: 24, padding: "22px 24px", color: "#fff",
              marginBottom: 24,
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <span style={{
                background: "rgba(166,115,241,0.3)", borderRadius: 20, padding: "5px 14px",
                fontSize: 14, fontWeight: 700,
              }}>
                ✨ Premium {isYearly ? "Yearly" : "Monthly"}
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap" style={{ gap: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                  {isCanceling
                    ? `${locale === "th" ? "สิ้นสุด" : "Ends"} · ${renewDate}`
                    : `${locale === "th" ? "ต่ออายุอัตโนมัติ" : "Auto-renews"} · ${renewDate}`}
                </div>
                <div style={{ fontSize: 14, opacity: 0.7 }}>
                  {isYearly
                    ? `฿790 / ${locale === "th" ? "ปี" : "year"} (${locale === "th" ? "ประหยัด 33%" : "Save 33%"})`
                    : `฿99 / ${locale === "th" ? "เดือน" : "month"}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  style={{
                    background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.2)",
                    borderRadius: 14, padding: "10px 18px", color: "#fff",
                    fontSize: 14, fontWeight: 700, cursor: portalLoading ? "wait" : "pointer",
                  }}
                >
                  {locale === "th" ? "จัดการการชำระเงิน" : "Manage billing"}
                </button>
                {!isCanceling && (
                  <button
                    onClick={() => setShowCancel(true)}
                    style={{
                      background: "transparent", border: "none",
                      color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", padding: "10px 8px",
                    }}
                  >
                    {locale === "th" ? "ยกเลิก" : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Portal error */}
          {portalError && (
            <div className="fade-in" style={{
              padding: "14px 18px", borderRadius: 14, marginBottom: 16,
              background: "#FDECEC", border: "1.5px solid #F5CECE",
              fontSize: 14, fontWeight: 600, color: "#D94444", textAlign: "center",
            }}>
              {locale === "th" ? "ไม่สามารถเปิดหน้าจัดการได้ ลองใหม่อีกครั้ง" : "Couldn't open billing. Please try again."}
            </div>
          )}

          {/* Canceling notice */}
          {isCanceling && (
            <div className="fade-in" style={{
              padding: "14px 18px", borderRadius: 16, marginBottom: 24,
              background: "#FEF6E8", border: "1.5px solid #F5DEB3",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                {t("subCancelingBand", { date: renewDate ?? "" })}
              </div>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                style={{
                  padding: "8px 16px", borderRadius: 14, border: "none",
                  background: "var(--primary)", fontSize: 14, fontWeight: 700,
                  color: "#fff", cursor: portalLoading ? "wait" : "pointer", flexShrink: 0,
                }}
              >
                {t("subResubscribe")}
              </button>
            </div>
          )}

          {/* What you get */}
          <div className="fade-in" style={{ marginBottom: 24, animationDelay: "60ms" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 14px" }}>
              {locale === "th" ? "สิ่งที่คุณได้" : "What you get"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={CARD}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                    {locale === "th" ? f.title : f.titleEn}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4 }}>
                    {locale === "th" ? f.desc : f.descEn}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage this month */}
          <div className="fade-in" style={{ animationDelay: "120ms" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 14px" }}>
              {locale === "th" ? "การใช้งานเดือนนี้" : "This month's usage"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={CARD}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 8 }}>
                  AI SUMMARIES
                </div>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)" }}>{usage?.nlp ?? "—"}</span>
                  <span style={{ fontSize: 14, color: "var(--ink-3)" }}>/ ∞ unlimited</span>
                </div>
              </div>
              <div style={CARD}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 8 }}>
                  {locale === "th" ? "รูปวิเคราะห์" : "VISION ANALYSIS"}
                </div>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)" }}>{usage?.vision ?? "—"}</span>
                  <span style={{ fontSize: 14, color: "var(--ink-3)" }}>/ ∞ unlimited</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel confirmation sheet */}
          <BottomSheet open={showCancel} onClose={() => setShowCancel(false)} aria-label={t("subCancelSheetTitle")}>
            <div style={{ padding: "8px 24px 36px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>😢</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                {t("subCancelSheetTitle")}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 24 }}>
                {t("subCancelSheetBody", { date: renewDate ?? "" })}
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <button
                  onClick={() => { setShowCancel(false); openPortal(); }}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 16,
                    border: "1.5px solid #F5DADA", background: "transparent",
                    fontSize: 14, fontWeight: 600, color: "#D94444", cursor: "pointer",
                  }}
                >
                  {t("subCancelSheetConfirm")}
                </button>
                <button
                  onClick={() => setShowCancel(false)}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 16,
                    border: "none", background: "var(--primary)",
                    fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                  }}
                >
                  {t("subCancelSheetKeep")}
                </button>
              </div>
            </div>
          </BottomSheet>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function TopBar({ t, router }: { t: (key: string) => string; router: ReturnType<typeof useRouter> }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 16px" }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          width: 40, height: 40, borderRadius: 14,
          background: "var(--surface-2)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function FreeState() {
  const locale = useLocale();
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
      <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 4 }}>
        {isTh ? "บัญชีและการใช้งาน" : "Account & usage"}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", margin: "0 0 20px" }}>
        {isTh ? "แพ็กเกจของคุณ" : "Your plan"}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
        {/* Free card */}
        <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600, marginBottom: 4 }}>
            {isTh ? "แผนปัจจุบัน" : "Current plan"}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Free</div>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 20 }}>
            {isTh ? "เพียงพอสำหรับการเริ่มต้น" : "Enough to get started"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            <div>
              <div className="flex items-center justify-between" style={{ fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: "var(--ink)" }}>Smart Log AI {isTh ? "วันนี้" : "today"}</span>
                <span style={{ fontWeight: 700 }}>3 / {isTh ? "วัน" : "day"}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#F2F0F5", overflow: "hidden" }}>
                <div style={{ width: "40%", height: "100%", borderRadius: 3, background: "#FCA45B" }} />
              </div>
            </div>
            <FreeLimitRow label={isTh ? "สถิติ" : "Stats"} value={isTh ? "สัปดาห์ + เดือน" : "Week + Month"} />
            <FreeLimitRow label="AI Insights" value={isTh ? "แค่ preview" : "Preview only"} />
            <FreeLockRow label="AI Vision" isTh={isTh} />
            <FreeLockRow label="Calendar AI + Ask AI" isTh={isTh} />
            <FreeLockRow label="Year-in-Pixels" isTh={isTh} />
            <FreeLockRow label="Custom Moods" isTh={isTh} />
            <FreeLockRow label={isTh ? "ส่งออกข้อมูล" : "Export"} isTh={isTh} />
          </div>
        </div>

        {/* Premium card */}
        <div
          style={{
            background: "linear-gradient(135deg, #F9A870 0%, #D4A0E8 50%, #C89BF5 100%)",
            borderRadius: 22, padding: 20, color: "#fff",
            display: "flex", flexDirection: "column", position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>+</div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginBottom: 4 }}>
            {isTh ? "อัพเกรด" : "Upgrade"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Premium</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>
            ฿99 / {isTh ? "เดือน" : "month"} · 7 {isTh ? "วันแรกฟรี" : "days free"}
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {(isTh ? [
              "Smart Log AI + Vision ไม่จำกัด",
              "สถิติปี + Activity Impact เต็ม",
              "AI Insights + พยากรณ์ + Mood DNA",
              "Calendar AI + Ask AI",
              "Year-in-Pixels + ส่งออก CSV/PDF",
              "Custom Moods + Icon Packs พิเศษ",
              "AI Coach รายวัน + Energy Clock",
            ] : [
              "Unlimited Smart Log AI + Vision",
              "Yearly stats + full Activity Impact",
              "AI Insights + Forecast + Mood DNA",
              "Calendar AI + Ask AI",
              "Year-in-Pixels + Export CSV/PDF",
              "Custom Moods + premium Icon Packs",
              "Daily AI Coach + Energy Clock",
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
              fontSize: 15, fontWeight: 800, cursor: "pointer",
            }}
          >
            {isTh ? "เริ่มทดลองฟรี 7 วัน →" : "Start 7-day free trial →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FreeLimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between" style={{ fontSize: 14 }}>
      <span style={{ color: "var(--ink)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--ink-3)" }}>{value}</span>
    </div>
  );
}

function FreeLockRow({ label, isTh }: { label: string; isTh: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ fontSize: 14 }}>
      <span style={{ color: "var(--ink)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#FCA45B" }}>🔒 {isTh ? "ล็อก" : "Locked"}</span>
    </div>
  );
}

/* ── Utilities ── */

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (locale === "th") {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
