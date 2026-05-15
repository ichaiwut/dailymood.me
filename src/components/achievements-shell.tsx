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
        <div style={{ height: 300, borderRadius: 22, background: "var(--surface-2)" }} className="skeleton-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const filtered = data.badges.filter((b) => filter === "all" || b.status === filter);
  const pct = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: locale === "th" ? "ทั้งหมด" : "All", count: data.total },
    { key: "earned", label: locale === "th" ? "ได้แล้ว" : "Earned", count: data.earned },
    { key: "in_progress", label: locale === "th" ? "กำลังทำ" : "In progress", count: data.inProgress },
    { key: "locked", label: locale === "th" ? "ล็อค" : "Locked", count: data.locked },
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <div className="achievements-layout" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}>
        {/* Left sidebar */}
        <div>
          <button
            onClick={() => router.push("/profile" as "/")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600, color: "var(--ink-3)", padding: 0, marginBottom: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {locale === "th" ? "โปรไฟล์" : "Profile"}
          </button>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>
            {locale === "th" ? "ความสำเร็จ" : "Achievements"}
          </h1>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 24 }}>
            {data.earned} {locale === "th" ? "จาก" : "of"} {data.total} {locale === "th" ? "ปลดล็อค" : "unlocked"}
          </div>

          {/* Progress Ring */}
          <div className="achievements-ring-wrap" style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <div className="achievements-ring" style={{ position: "relative", width: 160, height: 160 }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="#F2F0F5" strokeWidth="10" />
                <circle
                  cx="80" cy="80" r="68"
                  fill="none" stroke="#FCA45B" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 427} 427`}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div className="achievements-ring-pct" style={{ fontSize: 36, fontWeight: 800, color: "var(--ink)" }}>{pct}%</div>
                <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{locale === "th" ? "ปลดล็อคแล้ว" : "Unlocked"}</div>
              </div>
            </div>
          </div>

          {/* Filter list */}
          <div className="achievements-filters" style={{ borderRadius: 16, overflow: "hidden" }}>
            {filters.map((f) => (
              <button
                key={f.key}
                data-active={filter === f.key ? "true" : undefined}
                onClick={() => setFilter(f.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", border: "none", cursor: "pointer",
                  background: filter === f.key ? "var(--ink)" : "transparent",
                  color: filter === f.key ? "#fff" : "var(--ink)",
                  fontSize: 15, fontWeight: filter === f.key ? 700 : 500,
                  borderBottom: "1px solid var(--hairline)",
                  fontFamily: "inherit",
                }}
              >
                <span>{f.label}</span>
                <span style={{ fontWeight: 700, opacity: filter === f.key ? 1 : 0.5, marginLeft: 4 }}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Badge grid */}
        <div className="achievements-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignContent: "start" }}>
          {filtered.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} t={t} locale={locale} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "var(--ink-3)", fontSize: 14 }}>
              {locale === "th" ? "ไม่มี badge ในหมวดนี้" : "No badges in this category"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge, t, locale }: { badge: Badge; t: (k: string, v?: Record<string, string>) => string; locale: string }) {
  const isEarned = badge.status === "earned";
  const isLocked = badge.status === "locked";
  const isInProgress = badge.status === "in_progress";

  const borderColor = isEarned ? badge.color : isInProgress ? "#A673F1" : "#F2F0F5";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18, padding: "20px 16px",
        border: `2px ${isInProgress ? "dashed" : "solid"} ${borderColor}`,
        opacity: isLocked ? 0.5 : 1,
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: 16,
          background: isEarned ? `${badge.color}18` : "var(--surface-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, marginBottom: 14,
          filter: isLocked ? "grayscale(1)" : "none",
        }}
      >
        {badge.icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
        {t(`badge_${badge.id}` as "badge_streak_7")}
      </div>

      <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: isInProgress ? 8 : 0 }}>
        {t(`badge_${badge.id}_desc` as "badge_streak_7_desc")}
      </div>

      {isEarned && badge.earnedAt && (
        <div style={{ fontSize: 14, fontWeight: 600, color: badge.color, marginTop: 4 }}>
          {locale === "th" ? "ได้รับ" : "Earned"} · {formatBadgeDate(badge.earnedAt, locale)}
        </div>
      )}
      {isInProgress && (
        <div style={{ width: "100%", marginTop: 4 }}>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 6 }}>
            {badge.current}/{badge.target}
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "#F2F0F5", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3, background: "#A673F1",
              width: `${badge.progress}%`, transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function formatBadgeDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (locale === "th") {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
