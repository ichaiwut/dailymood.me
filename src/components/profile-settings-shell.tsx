"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CustomMoodManager } from "./custom-mood-manager";

export function ProfileSettingsShell({ isPremium }: { isPremium: boolean }) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();

  const [checkinOn, setCheckinOn] = useState(true);
  const [reminderTime] = useState("9:00 PM");
  const [reminderDays] = useState("Mon · Tue · Wed · Thu · Fri");
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "auto">("light");
  const [selectedPalette, setSelectedPalette] = useState<"neon" | "tempered" | "mono">("neon");
  const [hidePreview, setHidePreview] = useState(false);
  const [anonymousInsights, setAnonymousInsights] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleLocaleChange = (newLocale: string) => {
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).then(() => {
      globalThis.location.assign("/profile/settings");
    });
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0 20px", position: "relative" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            position: "absolute", left: 0,
            width: 40, height: 40, borderRadius: 12,
            background: "transparent", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{t("settingsTitle")}</div>
      </div>

      {/* Reminders */}
      <Section label={t("reminders")}>
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

      {/* Appearance */}
      <Section label={t("appearance")}>
        <SettingCard>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>{t("theme")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(["light", "dark", "auto"] as const).map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => setSelectedTheme(th)}
                  style={{
                    height: 72, borderRadius: 16, cursor: "pointer",
                    border: selectedTheme === th ? "2.5px solid var(--primary)" : "1.5px solid var(--hairline)",
                    background: th === "dark" ? "#1A1A1A" : th === "auto" ? "linear-gradient(135deg, #fff 50%, #1A1A1A 50%)" : "#fff",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {selectedTheme === th && (
                    <div style={{
                      position: "absolute", top: 6, right: 6,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  <div style={{
                    position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center",
                    fontSize: 14, fontWeight: 600, color: th === "dark" ? "#fff" : "var(--ink)",
                  }}>
                    {t(`theme${th.charAt(0).toUpperCase() + th.slice(1)}` as "themeLight")}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Divider />
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>{t("moodPalette")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(["neon", "tempered", "mono"] as const).map((pal) => {
                const swatches = {
                  neon: ["#FCA45B", "#85ECCB", "#FDCB56", "#A673F1"],
                  tempered: ["#E8A87C", "#8CC0A8", "#E8C77C", "#B8A0D0"],
                  mono: ["#333", "#555", "#999", "#CCC"],
                };
                return (
                  <button
                    key={pal}
                    type="button"
                    onClick={() => setSelectedPalette(pal)}
                    style={{
                      padding: "12px 10px 10px", borderRadius: 16, cursor: "pointer",
                      border: selectedPalette === pal ? "2.5px solid var(--primary)" : "1.5px solid var(--hairline)",
                      background: "var(--surface)", textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      {swatches[pal].map((c) => (
                        <div key={c} style={{ width: 20, height: 20, borderRadius: 6, background: c }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                      {t(`palette${pal.charAt(0).toUpperCase() + pal.slice(1)}` as "paletteNeon")}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </SettingCard>
      </Section>

      {/* Language */}
      <Section label={t("language")}>
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

      {/* Privacy & Security */}
      <Section label={t("privacySecurity")}>
        <SettingCard>
          <ToggleRow
            icon="👁️" iconBg="#9ACDE2"
            title={t("hidePreview")}
            subtitle={t("hidePreviewSub")}
            value={hidePreview} onChange={setHidePreview}
          />
          <Divider />
          <ToggleRow
            icon="📊" iconBg="#85ECCB"
            title={t("anonymousInsights")}
            subtitle={t("anonymousInsightsSub")}
            value={anonymousInsights} onChange={setAnonymousInsights}
          />
        </SettingCard>
      </Section>

      {/* Custom Moods (Premium) */}
      {isPremium && (
        <Section label={t("customMoods")}>
          <SettingCard>
            <div style={{ padding: "16px 20px" }}>
              <CustomMoodManager />
            </div>
          </SettingCard>
        </Section>
      )}

      {/* Data */}
      <Section label={t("data")}>
        <SettingCard>
          <NavRow icon="📥" iconBg="#D4BEE4" title={t("exportYourData")} value="CSV · JSON · PDF" />
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
      <Section label={t("about")}>
        <SettingCard>
          <NavRow icon="❓" iconBg="#F4F2F7" title={t("helpCenter")} />
          <Divider />
          <NavRow icon="💬" iconBg="#F4F2F7" title={t("sendFeedback")} />
          <Divider />
          <NavRow icon="📄" iconBg="#F4F2F7" title={t("termsLink")} href="/terms" />
          <Divider />
          <NavRow icon="🔒" iconBg="#F4F2F7" title={t("privacyLink")} href="/privacy" />
        </SettingCard>
      </Section>

      <div style={{ textAlign: "center", fontSize: 14, color: "var(--ink-3)", marginTop: 16 }}>
        {t("version")}
      </div>

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
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
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
        <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 1 }}>{subtitle}</div>
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
  icon, iconBg, title, value, href,
}: {
  icon: string; iconBg: string;
  title: string; value?: string; href?: string;
}) {
  const content = (
    <>
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: `${iconBg}18`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
        {value && <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 1 }}>{value}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
  const style = { display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", textDecoration: "none", color: "inherit" } as const;

  if (href) return <a href={href} style={style}>{content}</a>;
  return <div style={style}>{content}</div>;
}
