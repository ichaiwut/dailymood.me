"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PAClip, PAMark } from "@/components/paper";
import { AchievementDetailSheet } from "@/components/achievement-detail-sheet";
import { AchievementShareModal } from "@/components/achievement-share-modal";
import { formatBadgeDate } from "@/lib/format-badge-date";

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

/** Scrapbook rotations cycled across cards (locked cards stay flat). */
const ROT = [-1.7, 1.2, -0.9, 1.6, -1.3, 0.8];

/** Map a badge accent colour onto the nearest washi-tape tint. */
const WASHI_BY_COLOR: Record<string, string> = {
  "#A673F1": "lav",
  "#FDCB56": "yellow",
  "#85ECCB": "mint",
  "#FCA45B": "",
  "#FEAD8D": "",
};

export function AchievementsShell() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const th = locale === "th";
  const router = useRouter();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [detailBadge, setDetailBadge] = useState<Badge | null>(null);
  const [shareBadge, setShareBadge] = useState<Badge | null>(null);

  const badgeTitle = (b: Badge | null) => (b ? t(`badge_${b.id}` as "badge_streak_7") : "");
  const badgeDesc = (b: Badge | null) => (b ? t(`badge_${b.id}_desc` as "badge_streak_7_desc") : "");

  useEffect(() => {
    fetch("/api/profile/achievements")
      .then((r) => r.json() as Promise<AchievementsData>)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="pa-wrap fade-in ach-layout" style={{ paddingBottom: 40 }}>
        <div className="ach-rail">
          <div className="pa-sheet skeleton-pulse" style={{ height: 320, borderRadius: 18 }} />
        </div>
        <div className="ach-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pa-sheet skeleton-pulse" style={{ height: 210, borderRadius: 18 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filtered = data.badges.filter((b) => filter === "all" || b.status === filter);
  const pct = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;
  const C = 2 * Math.PI * 68; // ring circumference (r = 68)

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: th ? "ทั้งหมด" : "All", count: data.total },
    { key: "earned", label: th ? "ได้แล้ว" : "Earned", count: data.earned },
    { key: "in_progress", label: th ? "กำลังทำ" : "In progress", count: data.inProgress },
    { key: "locked", label: th ? "ยังไม่ได้" : "Locked", count: data.locked },
  ];

  return (
    <div className="pa-wrap fade-in" style={{ paddingBottom: 40 }}>
      <div className="ach-layout">
        {/* ── Left rail ── */}
        <div className="ach-rail">
          <button
            onClick={() => router.push("/profile" as "/")}
            className="pa-card-lift"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--surface)", border: "1px solid var(--hairline)",
              borderRadius: 100, cursor: "pointer", fontFamily: "inherit",
              fontSize: 14, fontWeight: 700, color: "var(--ink-2)",
              padding: "7px 14px", marginBottom: 18,
              boxShadow: "0 5px 14px -8px rgba(60,40,20,.4)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {th ? "โปรไฟล์" : "Profile"}
          </button>

          <div style={{ marginBottom: 12 }}>
            <span className="pa-chip" style={{ fontSize: 14 }}>🏆 {th ? "สมุดสะสม" : "Collection"}</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 32px)", fontWeight: 800, letterSpacing: "-0.022em", lineHeight: 1.12, color: "var(--ink)", margin: "0 0 8px" }}>
            {th ? <><PAMark>ความสำเร็จ</PAMark> ของคุณ</> : <>Your <PAMark>achievements</PAMark></>}
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 24px" }}>
            {th ? "เก็บสะสมไปเรื่อยๆ ตามจังหวะของคุณ" : "Collected at your own pace."}
          </p>

          {/* Progress folder */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            <span className="pa-tab purple">{th ? "ความคืบหน้า" : "Progress"}</span>
            <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "30px 22px 24px", position: "relative" }}>
              <div className="ach-ring">
                <svg width="100%" height="100%" viewBox="0 0 160 160" style={{ display: "block" }}>
                  <circle cx="80" cy="80" r="68" fill="none" stroke="var(--w-tint)" strokeWidth="12" />
                  <circle
                    cx="80" cy="80" r="68"
                    fill="none" stroke="var(--peach)" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * C} ${C}`}
                    transform="rotate(-90 80 80)"
                    style={{ transition: "stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "clamp(30px, 8vw, 40px)", fontWeight: 800, color: "var(--w-ink)", lineHeight: 1 }}>{pct}%</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-3)", marginTop: 4 }}>
                    {data.earned}/{data.total} {th ? "ปลดล็อก" : "unlocked"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="ach-filters">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`pa-filter ${filter === f.key ? "active" : ""}`}
                style={{ fontSize: 14 }}
              >
                {f.label} <span style={{ opacity: 0.55, marginLeft: 1 }}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Sticker grid ── */}
        <div className="ach-grid">
          {filtered.map((badge, i) => (
            <BadgeStickerCard key={badge.id} badge={badge} index={i} t={t} locale={locale} onOpen={setDetailBadge} />
          ))}
          {filtered.length === 0 && (
            <div className="pa-sheet" style={{ gridColumn: "1 / -1", borderRadius: 18, padding: "44px 20px", textAlign: "center", color: "var(--w-ink-3)" }}>
              <div style={{ fontSize: 34, marginBottom: 8 }} aria-hidden>🗂️</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{th ? "ยังไม่มีในหมวดนี้" : "Nothing in this filter yet"}</div>
            </div>
          )}
        </div>
      </div>

      <AchievementDetailSheet
        open={!!detailBadge}
        onClose={() => setDetailBadge(null)}
        badge={detailBadge}
        title={badgeTitle(detailBadge)}
        desc={badgeDesc(detailBadge)}
        locale={locale}
        onShare={() => {
          setShareBadge(detailBadge);
          setDetailBadge(null);
        }}
      />
      <AchievementShareModal
        open={!!shareBadge}
        onClose={() => setShareBadge(null)}
        badge={shareBadge}
        title={badgeTitle(shareBadge)}
        desc={badgeDesc(shareBadge)}
        locale={locale}
      />
    </div>
  );
}

function BadgeStickerCard({
  badge, index, t, locale, onOpen,
}: {
  badge: Badge;
  index: number;
  t: (k: string, v?: Record<string, string>) => string;
  locale: string;
  onOpen: (b: Badge) => void;
}) {
  const earned = badge.status === "earned";
  const inProgress = badge.status === "in_progress";
  const locked = badge.status === "locked";
  const rot = locked ? 0 : ROT[index % ROT.length];
  const washi = WASHI_BY_COLOR[badge.color] ?? "";

  return (
    <button
      type="button"
      onClick={() => onOpen(badge)}
      aria-label={t(`badge_${badge.id}` as "badge_streak_7")}
      className="pa-sheet pa-card-lift"
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "28px 16px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        transform: `rotate(${rot}deg)`,
        border: locked ? "2px dashed var(--w-rule-strong)" : undefined,
        opacity: locked ? 0.72 : 1,
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      {earned && <span className={`pa-washi ${washi}`} aria-hidden style={{ width: 84 }} />}
      {inProgress && <PAClip style={{ top: -15, right: 16, transform: "rotate(9deg)", zIndex: 8 }} />}

      <BadgeSticker emoji={badge.icon} color={badge.color} status={badge.status} />

      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--w-ink)", lineHeight: 1.25 }}>
        {t(`badge_${badge.id}` as "badge_streak_7")}
      </div>
      <div style={{ fontSize: 14, color: "var(--w-ink-2)", lineHeight: 1.5, marginTop: -2 }}>
        {t(`badge_${badge.id}_desc` as "badge_streak_7_desc")}
      </div>

      {earned && (
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4,
            fontSize: 14, fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase",
            color: badge.color, background: `${badge.color}1f`, border: `1.5px solid ${badge.color}`,
            borderRadius: 9, padding: "5px 11px", transform: "rotate(-3.5deg)",
          }}
        >
          ✓ {badge.earnedAt ? formatBadgeDate(badge.earnedAt, locale) : locale === "th" ? "ได้รับแล้ว" : "Earned"}
        </span>
      )}

      {inProgress && (
        <div style={{ width: "100%", marginTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-ink-2)", marginBottom: 7 }}>
            {badge.current} / {badge.target}
          </div>
          <div style={{ height: 8, borderRadius: 6, background: "var(--w-tint)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 6, width: `${badge.progress}%`, background: badge.color, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
          </div>
        </div>
      )}
    </button>
  );
}

function BadgeSticker({ emoji, color, status }: { emoji: string; color: string; status: BadgeStatus }) {
  const earned = status === "earned";
  const locked = status === "locked";
  return (
    <div
      aria-hidden
      style={{
        width: 66, height: 66, borderRadius: "50%",
        display: "grid", placeItems: "center", marginBottom: 2,
        background: earned ? color : locked ? "var(--w-tint)" : `${color}26`,
        border: "4px solid #fff",
        boxShadow: "0 10px 22px -8px rgba(0,0,0,.3)",
        filter: locked ? "grayscale(1)" : "none",
        opacity: locked ? 0.85 : 1,
      }}
    >
      <span style={{ fontSize: 30, lineHeight: 1 }}>{emoji}</span>
    </div>
  );
}
