"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type BadgeStatus = "earned" | "in_progress" | "locked";

interface Badge {
  id: string;
  icon: string;
  color: string;
  target: number;
  current: number;
  progress: number;
  status: BadgeStatus;
  earnedAt: string | null;
}

interface AchievementsData {
  total: number;
  earned: number;
  inProgress: number;
  locked: number;
  badges: Badge[];
}

type Filter = "all" | "earned" | "in_progress" | "locked";

export function AchievementsShell() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/profile/achievements")
      .then((r) => r.json() as Promise<AchievementsData>)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: "24px 0" }}>
        <div style={{ height: 120, borderRadius: 22, background: "var(--surface-2)", marginBottom: 16 }} className="skeleton-pulse" />
        <div style={{ height: 300, borderRadius: 22, background: "var(--surface)", marginBottom: 16 }} className="skeleton-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const filtered = data.badges.filter((b) => filter === "all" || b.status === filter);

  const filters: { key: Filter; count: number }[] = [
    { key: "all", count: data.total },
    { key: "earned", count: data.earned },
    { key: "in_progress", count: data.inProgress },
    { key: "locked", count: data.locked },
  ];

  const pct = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;

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
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{t("achievementsTitle")}</div>
      </div>

      {/* Hero Progress */}
      <div
        className="fade-in"
        style={{
          background: "linear-gradient(135deg, #FFF9F5 0%, #F8F2FD 100%)",
          borderRadius: 22, padding: "24px",
          display: "flex", alignItems: "center", gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Progress Ring */}
        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="38" fill="none" stroke="var(--hairline)" strokeWidth="6" />
            <circle
              cx="44" cy="44" r="38"
              fill="none" stroke="#FCA45B" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 239} 239`}
              transform="rotate(-90 44 44)"
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "var(--ink)",
          }}>
            {pct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4 }}>
            {t("yourJourney")}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
            {t("unlocked", { earned: String(data.earned), total: String(data.total) })}
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", scrollbarWidth: "none" }}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              padding: "8px 14px", borderRadius: 20,
              background: filter === f.key ? "var(--ink)" : "transparent",
              color: filter === f.key ? "#fff" : "var(--ink-2)",
              border: filter === f.key ? "none" : "1.5px solid var(--hairline-2)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {t(filterKey(f.key))} {f.count}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {filtered.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} t={t} locale={locale} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-3)", fontSize: 14 }}>
          {filter === "earned" ? "No badges earned yet" : "No badges in this category"}
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge, t, locale }: { badge: Badge; t: (k: string, v?: Record<string, string>) => string; locale: string }) {
  const isEarned = badge.status === "earned";
  const isLocked = badge.status === "locked";
  const isInProgress = badge.status === "in_progress";

  const borderColor = isEarned ? badge.color : isInProgress ? "#A673F1" : "var(--hairline)";
  const borderStyle = isEarned ? "solid" : "dashed";

  return (
    <div
      style={{
        background: isEarned ? `${badge.color}08` : isInProgress ? "#FAF7FE" : "var(--surface)",
        borderRadius: 22, padding: "20px 16px 16px",
        border: `2px ${borderStyle} ${borderColor}`,
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: 16,
          background: isEarned ? `${badge.color}20` : "var(--surface-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, marginBottom: 14,
          filter: isLocked ? "grayscale(1)" : "none",
        }}
      >
        {badge.icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
        {t(`badge_${badge.id}` as "badge_streak_7")}
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
        {t(`badge_${badge.id}_desc` as "badge_streak_7_desc")}
      </div>

      {isEarned && badge.earnedAt && (
        <div style={{ fontSize: 12, fontWeight: 600, color: badge.color }}>
          ✓ {formatBadgeDate(badge.earnedAt, locale)}
        </div>
      )}
      {isInProgress && (
        <div>
          <div style={{
            height: 6, borderRadius: 3, background: "var(--hairline)",
            overflow: "hidden", marginBottom: 4,
          }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: badge.color,
              width: `${badge.progress}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>
            {badge.progress}%
          </div>
        </div>
      )}
    </div>
  );
}

const FILTER_KEYS: Record<Filter, string> = {
  all: "filterAll",
  earned: "filterEarned",
  in_progress: "filterInProgress",
  locked: "filterLocked",
};

function filterKey(f: Filter): string {
  return FILTER_KEYS[f];
}

function formatBadgeDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (locale === "th") {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}
