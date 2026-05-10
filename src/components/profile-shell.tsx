"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { CustomMoodManager } from "./custom-mood-manager";

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
    locale: string;
    isPremium: boolean;
    bio: string | null;
    accentColor: string | null;
    hidePreview: boolean;
    anonymousInsights: boolean;
    createdAt: string;
  };
  stats: {
    streak: number;
    totalEntries: number;
    avgMood: number | null;
    avgMoodEmoji: string | null;
  };
  moodSignature: {
    distribution: {
      moodId: string;
      label: string;
      labelTh: string | null;
      color: string;
      emoji: string;
      percent: number;
      count: number;
    }[];
    hasSufficientData: boolean;
  };
  tier: "guest" | "free" | "premium";
}

const ACCENT_GRADIENTS: Record<string, string> = {
  "#A673F1": "linear-gradient(135deg, #A673F1 0%, #C89BF5 40%, #FCA45B 100%)",
  "#FCA45B": "linear-gradient(135deg, #FCA45B 0%, #FEAD8D 40%, #F29BAB 100%)",
  "#85ECCB": "linear-gradient(135deg, #85ECCB 0%, #9ACDE2 50%, #A673F1 100%)",
  "#FDCB56": "linear-gradient(135deg, #FDCB56 0%, #FCA45B 50%, #F29BAB 100%)",
  "#9ACDE2": "linear-gradient(135deg, #9ACDE2 0%, #85ECCB 50%, #A673F1 100%)",
  "#D4BEE4": "linear-gradient(135deg, #D4BEE4 0%, #A673F1 50%, #9ACDE2 100%)",
};

const DEFAULT_ACCENT = "#A673F1";

export function ProfileShell() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackCooldown, setFeedbackCooldown] = useState(0);
  const [achievements, setAchievements] = useState<{
    total: number;
    earned: number;
    badges: { id: string; icon: string; color: string; status: string; earnedAt: string | null; progress: number }[];
  } | null>(null);

  // settings state
  const [checkinOn, setCheckinOn] = useState(true);
  const [reminderTime] = useState("9:00 PM");
  const [reminderDays] = useState("Mon · Tue · Wed · Thu · Fri");
  const [hidePreview, setHidePreview] = useState(false);
  const [anonymousInsights, setAnonymousInsights] = useState(true);

  const openFeedback = () => {
    setFeedbackCooldown(0);
    setFeedbackSent(false);
    setFeedbackText("");
    setShowFeedback(true);
    fetch("/api/feedback")
      .then((r) => r.json() as Promise<{ cooldown: boolean; remainMin: number }>)
      .then((d) => { if (d.cooldown) setFeedbackCooldown(d.remainMin); });
  };

  const patchSetting = (key: string, value: boolean) => {
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  };

  useEffect(() => {
    let cancel = false;
    fetch("/api/profile")
      .then((r) => r.json() as Promise<ProfileData>)
      .then((d) => {
        if (cancel) return;
        setData(d);
        setHidePreview(d.user.hidePreview);
        setAnonymousInsights(d.user.anonymousInsights);
      })
      .finally(() => { if (!cancel) setLoading(false); });

    fetch("/api/profile/achievements")
      .then((r) => r.json() as Promise<NonNullable<typeof achievements>>)
      .then((d) => { if (!cancel) setAchievements(d); });

    return () => { cancel = true; };
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).then(() => {
      globalThis.location.assign(`/${newLocale}/profile`);
    });
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: "24px 0" }}>
        <div style={{ height: 220, borderRadius: 28, background: "var(--surface-2)", marginBottom: 16 }} className="skeleton-pulse" />
        <div style={{ height: 140, borderRadius: 22, background: "var(--surface)", marginBottom: 16 }} className="skeleton-pulse" />
        <div style={{ height: 200, borderRadius: 22, background: "var(--surface)", marginBottom: 16 }} className="skeleton-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const accent = data.user.accentColor || DEFAULT_ACCENT;
  const gradient = ACCENT_GRADIENTS[accent] || ACCENT_GRADIENTS[DEFAULT_ACCENT];
  const initials = getInitials(data.user.name, data.user.email);
  const memberDate = formatMemberDate(data.user.createdAt, locale);

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Hero Card */}
      <div
        className="fade-in"
        style={{
          background: gradient,
          borderRadius: 28,
          padding: "28px 24px 20px",
          color: "#fff",
          position: "relative",
          boxShadow: "0 8px 32px rgba(166,115,241,0.25)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Link href={"/profile/edit" as "/"} style={{ position: "relative", flexShrink: 0 }}>
            {data.user.image ? (
              <img
                src={data.user.image}
                alt=""
                referrerPolicy="no-referrer"
                style={{
                  width: 76, height: 76, borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(255,255,255,0.4)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 76, height: 76, borderRadius: "50%",
                  background: accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 800, color: "#fff",
                  border: "3px solid rgba(255,255,255,0.4)",
                }}
              >
                {initials}
              </div>
            )}
            <div
              style={{
                position: "absolute", bottom: -2, right: -2,
                width: 26, height: 26, borderRadius: "50%",
                background: "#FCA45B", border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12,
              }}
            >
              ✏️
            </div>
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              {data.user.name || data.user.email.split("@")[0]}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
              {t("memberSince", { date: memberDate })}
            </div>
            {data.user.isPremium && (
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  marginTop: 6, fontSize: 11, fontWeight: 700,
                  background: "rgba(255,255,255,0.2)", borderRadius: 20,
                  padding: "3px 10px", letterSpacing: 0.3,
                }}
              >
                ● PLUS
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            background: "rgba(255,255,255,0.18)", borderRadius: 18,
            padding: "14px 8px", textAlign: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <Link href={"/profile/achievements" as "/"} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>{t("streak")}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {data.stats.streak} <span style={{ fontSize: 16 }}>🔥</span>
            </div>
          </Link>
          <Link href={"/calendar" as "/"} style={{ textDecoration: "none", color: "inherit", borderLeft: "1px solid rgba(255,255,255,0.2)", borderRight: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>{t("entries")}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {data.stats.totalEntries} <span style={{ fontSize: 16 }}>📓</span>
            </div>
          </Link>
          <Link href={"/stats" as "/"} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>{t("avgMood")}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {data.stats.avgMood?.toFixed(1) ?? "—"} <span style={{ fontSize: 16 }}>{data.stats.avgMoodEmoji ?? "😐"}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Mood Signature Card */}
      <div
        className="fade-in"
        style={{
          background: "var(--surface)", borderRadius: 22,
          border: "1.5px solid var(--hairline)", padding: "20px 20px 18px",
          marginBottom: 16, animationDelay: "60ms",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
          {t("moodSignature")}
        </div>
        {data.moodSignature.hasSufficientData ? (
          <>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3, marginBottom: 14 }}>
              {buildSignatureHeadline(data.moodSignature.distribution, locale, t)}
            </div>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 10 }}>
              {data.moodSignature.distribution.map((m) => (
                <div key={m.moodId} style={{ width: `${m.percent}%`, background: m.color, minWidth: m.percent > 0 ? 4 : 0 }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
              {data.moodSignature.distribution.slice(0, 3).map((m) => {
                const label = locale === "th" && m.labelTh ? m.labelTh : m.label;
                return `${label} ${m.percent}%`;
              }).join(" · ")}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, color: "var(--ink-3)", padding: "12px 0" }}>
            {t("signatureNoData")}
          </div>
        )}
      </div>

      {/* Achievements Row */}
      {achievements && achievements.badges.length > 0 && (
        <div className="fade-in" style={{ marginBottom: 20, animationDelay: "120ms" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{t("achievements")}</div>
            <Link
              href={"/profile/achievements" as "/"}
              style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
            >
              {t("achievementsCount", { earned: String(achievements.earned), total: String(achievements.total) })} →
            </Link>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {achievements.badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                style={{
                  flexShrink: 0, width: 72, height: 72, borderRadius: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28,
                  background: badge.status === "earned" ? `${badge.color}18` : "var(--surface-2)",
                  border: badge.status === "earned"
                    ? `2px solid ${badge.color}`
                    : badge.status === "in_progress"
                      ? "2px dashed var(--hairline-2)"
                      : "2px dashed var(--hairline)",
                  opacity: badge.status === "locked" ? 0.45 : 1,
                  filter: badge.status === "locked" ? "grayscale(1)" : "none",
                }}
              >
                {badge.icon}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Settings Sections ── */}

      {/* Reminders */}
      <Section label={t("reminders")} delay="180ms">
        <SettingCard>
          <ToggleRow
            icon="🔔" iconBg="#FCA45B"
            title={t("dailyCheckin")}
            subtitle={t("dailyCheckinSub", { time: reminderTime })}
            value={checkinOn} onChange={setCheckinOn}
          />
          {checkinOn && (
            <>
              <Divider />
              <NavRow icon="🕐" iconBg="#A673F1" title={t("reminderTime")} value={reminderTime} />
              <Divider />
              <NavRow icon="📅" iconBg="#85ECCB" title={t("reminderDays")} value={reminderDays} />
            </>
          )}
        </SettingCard>
      </Section>

      {/* Language */}
      <Section label={t("language")} delay="210ms">
        <SettingCard>
          <div style={{ padding: "4px 20px" }}>
            {[
              { code: "en", label: "English" },
              { code: "th", label: "ภาษาไทย" },
            ].map((lang) => (
              <label
                key={lang.code}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 0", cursor: "pointer",
                  borderBottom: lang.code === "en" ? "1px solid var(--hairline)" : "none",
                }}
              >
                <div
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: locale === lang.code ? "6px solid var(--primary)" : "2px solid var(--hairline-2)",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{lang.label}</span>
                <input
                  type="radio"
                  name="locale"
                  checked={locale === lang.code}
                  onChange={() => handleLocaleChange(lang.code)}
                  style={{ display: "none" }}
                />
              </label>
            ))}
          </div>
        </SettingCard>
      </Section>

      {/* Privacy */}
      <Section label={t("privacySecurity")} delay="270ms">
        <SettingCard>
          <ToggleRow
            icon="👁️" iconBg="#9ACDE2"
            title={t("hidePreview")}
            subtitle={t("hidePreviewSub")}
            value={hidePreview} onChange={(v) => { setHidePreview(v); patchSetting("hidePreview", v); }}
          />
        </SettingCard>
      </Section>

      {/* Custom Moods (Premium) */}
      {data.user.isPremium && (
        <Section label={t("customMoods")} delay="300ms">
          <SettingCard>
            <div style={{ padding: "16px 20px" }}>
              <CustomMoodManager />
            </div>
          </SettingCard>
        </Section>
      )}

      {/* Data */}
      <Section label={t("data")} delay="330ms">
        <SettingCard>
          <div
            role="button"
            tabIndex={0}
            onClick={() => { globalThis.location.assign("/api/profile/export"); }}
            onKeyDown={(e) => { if (e.key === "Enter") globalThis.location.assign("/api/profile/export"); }}
            style={{ cursor: "pointer" }}
          >
            <NavRow icon="📥" iconBg="#D4BEE4" title={t("exportYourData")} value="CSV" />
          </div>
          <Divider />
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%",
              padding: "16px 20px", background: "transparent", border: "none",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: "#F5DADA", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>
              🗑️
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#D94444" }}>{t("clearAllEntries")}</div>
          </button>
        </SettingCard>
      </Section>

      {/* About */}
      <Section label={t("about")} delay="360ms">
        <SettingCard>
          <div role="button" tabIndex={0} onClick={() => openFeedback()} onKeyDown={(e) => { if (e.key === "Enter") openFeedback(); }} style={{ cursor: "pointer" }}>
            <NavRow icon="💬" iconBg="#F4F2F7" title={t("sendFeedback")} />
          </div>
          <Divider />
          <NavRow icon="📄" iconBg="#F4F2F7" title={t("termsPrivacy")} />
        </SettingCard>
      </Section>

      {/* Footer Actions */}
      <div className="fade-in" style={{ display: "flex", gap: 12, marginBottom: 16, animationDelay: "390ms" }}>
        <button
          type="button"
          onClick={() => setShowSignOut(true)}
          style={{
            flex: 1, padding: "14px 0", borderRadius: 16,
            border: "1.5px solid #F5DADA", background: "transparent",
            fontSize: 14, fontWeight: 600, color: "#D94444", cursor: "pointer",
          }}
        >
          {t("signOut")}
        </button>
      </div>

      {/* Version */}
      <div className="fade-in" style={{ textAlign: "center", fontSize: 12, color: "var(--ink-3)", animationDelay: "420ms" }}>
        {t("version")} · {t("madeWith")}
      </div>

      {/* Sign Out Confirmation */}
      {showSignOut && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(10,10,10,0.32)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={() => setShowSignOut(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "var(--surface)", borderRadius: "24px 24px 0 0",
              padding: "28px 24px 36px", textAlign: "center",
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--hairline-2)", margin: "0 auto 20px" }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 20 }}>
              {t("signOutConfirm")}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowSignOut(false)}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 16,
                  border: "1.5px solid var(--hairline-2)", background: "transparent",
                  fontSize: 14, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer",
                }}
              >
                {t("signOutCancel")}
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 16,
                  border: "none", background: "#D94444",
                  fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                }}
              >
                {t("signOutYes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirm */}
      {showClearConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(10,10,10,0.32)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "var(--surface)", borderRadius: "24px 24px 0 0",
              padding: "28px 24px 36px", textAlign: "center",
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--hairline-2)", margin: "0 auto 20px" }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
              {t("clearConfirmTitle")}
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 20 }}>
              {t("clearConfirmBody")}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 16,
                  border: "1.5px solid var(--hairline-2)", background: "transparent",
                  fontSize: 14, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer",
                }}
              >
                {t("clearCancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/profile/clear", { method: "DELETE" });
                  setShowClearConfirm(false);
                  globalThis.location.reload();
                }}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 16,
                  border: "none", background: "#D94444",
                  fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                }}
              >
                {t("clearConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Sheet */}
      {showFeedback && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(10,10,10,0.32)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={() => { if (!feedbackSending) { setShowFeedback(false); setFeedbackText(""); setFeedbackSent(false); } }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "var(--surface)", borderRadius: "24px 24px 0 0",
              padding: "28px 24px 36px",
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--hairline-2)", margin: "0 auto 20px" }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
              {t("sendFeedback")}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 16 }}>
              {t("feedbackHint")}
            </div>
            {feedbackSent ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💜</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 20 }}>{t("feedbackThanks")}</div>
                <button
                  type="button"
                  onClick={() => { setShowFeedback(false); setFeedbackSent(false); }}
                  style={{
                    padding: "12px 32px", borderRadius: 16,
                    border: "none", background: "var(--ink)",
                    fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                  }}
                >
                  {t("feedbackClose")}
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value.slice(0, 1000))}
                  placeholder={t("feedbackPlaceholder")}
                  rows={4}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 16,
                    border: "1.5px solid var(--hairline-2)", background: "var(--surface-2)",
                    fontSize: 15, color: "var(--ink)", outline: "none",
                    fontFamily: "inherit", resize: "none",
                  }}
                />
                <div style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right", marginTop: 4, marginBottom: 16 }}>
                  {feedbackText.length}/1000
                </div>
                <button
                  type="button"
                  disabled={!feedbackText.trim() || feedbackSending || feedbackCooldown > 0}
                  onClick={async () => {
                    setFeedbackSending(true);
                    const res = await fetch("/api/feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ message: feedbackText.trim() }),
                    });
                    setFeedbackSending(false);
                    if (res.status === 429) {
                      const { remainMin } = (await res.json()) as { remainMin: number };
                      setFeedbackCooldown(remainMin);
                      return;
                    }
                    setFeedbackSent(true);
                    setFeedbackText("");
                  }}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 16,
                    border: "none",
                    background: feedbackText.trim() && !feedbackCooldown ? "var(--ink)" : "var(--hairline)",
                    fontSize: 14, fontWeight: 700,
                    color: feedbackText.trim() && !feedbackCooldown ? "#fff" : "var(--ink-3)",
                    cursor: feedbackText.trim() && !feedbackCooldown ? "pointer" : "default",
                  }}
                >
                  {feedbackSending ? t("feedbackSending") : feedbackCooldown > 0 ? t("feedbackCooldown", { min: String(feedbackCooldown) }) : t("feedbackSend")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ── */

function Section({ label, delay, children }: { label: string; delay: string; children: React.ReactNode }) {
  return (
    <div className="fade-in" style={{ marginBottom: 24, animationDelay: delay }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: "var(--ink-3)",
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

function ToggleRow({
  icon, iconBg, title, subtitle, value, onChange,
}: {
  icon: string; iconBg: string;
  title: string; subtitle: string;
  value: boolean; onChange: (v: boolean) => void;
}) {
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
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 1 }}>{subtitle}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 50, height: 28, borderRadius: 14,
          background: value ? "var(--primary)" : "var(--hairline)",
          border: "none", cursor: "pointer", position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "#fff", position: "absolute",
          top: 3, left: value ? 25 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </button>
    </div>
  );
}

function NavRow({
  icon, iconBg, title, value,
}: {
  icon: string; iconBg: string;
  title: string; value?: string;
}) {
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
        {value && <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 1 }}>{value}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ── Utilities ── */

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatMemberDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (locale === "th") {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function buildSignatureHeadline(
  distribution: ProfileData["moodSignature"]["distribution"],
  locale: string,
  t: (key: string, values?: Record<string, string>) => string,
): string {
  if (distribution.length === 0) return "";
  const top = distribution[0];
  const topLabel = locale === "th" && top.labelTh ? top.labelTh : top.label;

  if (top.percent >= 50) {
    return t("signaturePrefix", { mood: topLabel.toLowerCase() });
  }
  if (distribution.length >= 2) {
    const second = distribution[1];
    const secondLabel = locale === "th" && second.labelTh ? second.labelTh : second.label;
    if (top.percent + second.percent >= 70) {
      return t("signatureMix", { mood1: topLabel.toLowerCase(), mood2: secondLabel.toLowerCase() });
    }
    return t("signatureBalanced", { mood1: topLabel.toLowerCase(), mood2: secondLabel.toLowerCase() });
  }
  return t("signaturePrefix", { mood: topLabel.toLowerCase() });
}
