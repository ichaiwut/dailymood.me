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

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<SubData>;
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
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
  const memberMonths = computeMemberMonths(data.memberSince);
  const isYearly = data.planInterval === "year";
  const isCanceling = data.cancelAtPeriodEnd;
  const isTrial = data.subscriptionStatus === "trialing";

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      <TopBar t={t} router={router} />

      {!data.isPremium ? (
        <FreeState />
      ) : (
        <>
          {/* Hero Card */}
          <div
            className="fade-in"
            style={{
              background: "linear-gradient(135deg, #7B4FD3 0%, #A673F1 40%, #C89BF5 100%)",
              borderRadius: 28,
              padding: "28px 24px 22px",
              color: "#fff",
              position: "relative",
              boxShadow: "0 8px 32px rgba(123,79,211,0.3)",
              marginBottom: 16,
            }}
          >
            {/* Status row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: isCanceling ? "rgba(252,164,91,0.25)" : isTrial ? "rgba(133,236,203,0.25)" : "rgba(255,255,255,0.2)",
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
                }}
              >
                {isCanceling
                  ? `⏳ ${t("subStatusCanceling").toUpperCase()}`
                  : isTrial
                    ? `🎁 ${t("subStatusTrialing").toUpperCase()}`
                    : `✨ ${t("subStatusActive").toUpperCase()}`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, letterSpacing: 0.5 }}>
                {t(isYearly ? "subIntervalYearly" : "subIntervalMonthly")}
              </div>
            </div>

            {/* Plan title */}
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
              DailyMood Pro
            </div>
            <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 20 }}>
              {isCanceling
                ? t("subEndsOn", { date: renewDate ?? "" })
                : isTrial
                  ? t("subTrialEndsOn", { date: renewDate ?? "" })
                  : t("subRenewsOn", { date: renewDate ?? "" })}
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                background: "rgba(255,255,255,0.15)", borderRadius: 16,
                padding: "14px 16px",
                backdropFilter: "blur(8px)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.75, marginBottom: 4, letterSpacing: 0.3 }}>
                  {t("subNextCharge")}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {isCanceling ? "—" : (isYearly ? "฿949" : "฿99")}
                </div>
                {!isCanceling && renewDate && (
                  <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>
                    {isTrial ? (
                      <>
                        <div>{t("subTrialNow")}</div>
                        <div>{t("subTrialChargeDate", { date: renewDate })}</div>
                      </>
                    ) : renewDate}
                  </div>
                )}
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.75, marginBottom: 4, letterSpacing: 0.3 }}>
                  {t("subMemberFor")}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {memberMonths <= 1
                    ? t("subMonth", { n: String(memberMonths) })
                    : t("subMonths", { n: String(memberMonths) })}
                </div>
              </div>
            </div>
          </div>

          {/* Canceling notice */}
          {isCanceling && (
            <div
              className="fade-in"
              style={{
                padding: "14px 18px", borderRadius: 16, marginBottom: 16,
                background: "#FEF6E8", border: "1.5px solid #F5DEB3",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>⏳</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>
                  {t("subCancelingBand", { date: renewDate ?? "" })}
                </div>
              </div>
              <button
                type="button"
                onClick={openPortal}
                disabled={portalLoading}
                style={{
                  padding: "8px 16px", borderRadius: 12,
                  border: "none", background: "var(--primary)",
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  cursor: portalLoading ? "wait" : "pointer",
                  flexShrink: 0,
                }}
              >
                {t("subResubscribe")}
              </button>
            </div>
          )}

          {/* Portal error toast */}
          {portalError && (
            <div
              className="fade-in"
              style={{
                padding: "12px 18px", borderRadius: 14, marginBottom: 16,
                background: "#FDECEC", border: "1.5px solid #F5CECE",
                fontSize: 14, fontWeight: 600, color: "#D94444", textAlign: "center",
              }}
            >
              {locale === "th" ? "ไม่สามารถเปิดหน้าจัดการได้ ลองใหม่อีกครั้ง" : "Couldn't open billing. Please try again."}
            </div>
          )}

          {/* Billing section */}
          <Section label={t("subBilling")} delay="60ms">
            <SettingCard>
              <PortalButton loading={portalLoading} onClick={openPortal}>
                <NavRow icon="💳" iconBg="#9ACDE2" title={t("subPaymentMethod")} subtitle={t("subPaymentMethodSub")} />
              </PortalButton>
              <Divider />
              <PortalButton loading={portalLoading} onClick={openPortal}>
                <NavRow icon="📋" iconBg="#85ECCB" title={t("subBillingHistory")} subtitle={t("subBillingHistorySub")} />
              </PortalButton>
              {!isYearly && !isCanceling && (
                <>
                  <Divider />
                  <PortalButton loading={portalLoading} onClick={openPortal}>
                    <NavRow icon="💡" iconBg="#FDCB56" title={t("subSwitchYearly")} subtitle={t("subSwitchYearlySub")} />
                  </PortalButton>
                </>
              )}
            </SettingCard>
          </Section>

          {/* Cancel section */}
          {!isCanceling && (
            <div className="fade-in" style={{ marginTop: 8, animationDelay: "120ms" }}>
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 16,
                  border: "1.5px solid var(--hairline-2)", background: "transparent",
                  fontSize: 14, fontWeight: 600, color: "var(--ink-3)",
                  cursor: "pointer",
                }}
              >
                {t("subCancelButton")}
              </button>
              <div style={{ fontSize: 14, color: "var(--ink-3)", textAlign: "center", marginTop: 8 }}>
                {t("subCancelFooter")}
              </div>
            </div>
          )}

          {/* Cancel confirmation sheet */}
          <BottomSheet open={showCancel} onClose={() => setShowCancel(false)} aria-label={t("subCancelSheetTitle")}>
            <div style={{ padding: "8px 24px 36px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>😢</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                {t("subCancelSheetTitle")}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 24 }}>
                {t("subCancelSheetBody", { date: renewDate ?? "" })}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancel(false);
                    openPortal();
                  }}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 16,
                    border: "1.5px solid #F5DADA", background: "transparent",
                    fontSize: 14, fontWeight: 600, color: "#D94444",
                    cursor: "pointer",
                  }}
                >
                  {t("subCancelSheetConfirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancel(false)}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 16,
                    border: "none", background: "var(--primary)",
                    fontSize: 14, fontWeight: 700, color: "#fff",
                    cursor: "pointer",
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 16px" }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: "var(--surface-2)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
        {t("subscription")}
      </h1>
    </div>
  );
}

function FreeState() {
  const t = useTranslations("profile");
  const locale = useLocale();
  return (
    <div className="fade-in" style={{ padding: "40px 0", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
        {t("subFreeTitle")}
      </div>
      <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 300, margin: "0 auto 24px" }}>
        {t("subFreeBody")}
      </div>
      <a
        href="/pricing"
        style={{
          display: "inline-block", padding: "14px 32px", borderRadius: 20,
          border: "none", background: "var(--ink)", color: "#fff",
          fontSize: 15, fontWeight: 700, textDecoration: "none",
        }}
      >
        {t("subFreeUpgrade")}
      </a>
    </div>
  );
}

function PortalButton({ loading, onClick, children }: { loading: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{ width: "100%", background: "transparent", border: "none", cursor: loading ? "wait" : "pointer", textAlign: "left" }}
    >
      {children}
    </button>
  );
}

/* ── Layout helpers ── */

function Section({ label, delay, children }: { label: string; delay: string; children: React.ReactNode }) {
  return (
    <div className="fade-in" style={{ marginBottom: 24, animationDelay: delay }}>
      <div style={{
        fontSize: 14, fontWeight: 800, color: "var(--ink-3)",
        letterSpacing: 0.4, textTransform: "uppercase",
        marginBottom: 10, paddingLeft: 4,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 22,
      border: "1.5px solid var(--hairline)", overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--hairline)", marginLeft: 76 }} />;
}

function NavRow({ icon, iconBg, title, subtitle }: { icon: string; iconBg: string; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: `${iconBg}18`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 1 }}>{subtitle}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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

function computeMemberMonths(memberSince: string): number {
  const start = new Date(memberSince);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(1, months);
}
