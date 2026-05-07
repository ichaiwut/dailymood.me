"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { MoodIcon } from "./mood-icon";

/* ─── Tab pills ─── */

export function TabPills({
  value,
  onChange,
}: {
  value: "today" | "week" | "month";
  onChange: (v: "today" | "week" | "month") => void;
}) {
  const t = useTranslations("home");
  const items: { id: typeof value; label: string }[] = [
    { id: "today", label: t("tabToday") },
    { id: "week", label: t("tabWeek") },
    { id: "month", label: t("tabMonth") },
  ];
  return (
    <div className="flex gap-2.5 overflow-x-auto -mx-1 px-1">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className="px-5 py-2.5 text-base font-semibold rounded-full transition-all shrink-0"
            style={{
              background: active ? "var(--accent)" : "var(--surface)",
              color: "var(--ink)",
              boxShadow: active
                ? "0 6px 14px -6px rgba(255,168,51,0.55)"
                : "var(--shadow-card)",
              transform: active ? "scale(1.02)" : "scale(1)",
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Day strip (7 days, ending today) ─── */

export function DayStrip({ today }: { today?: Date }) {
  const locale = useLocale();
  const days = useMemo(() => buildWeek(today ?? new Date(), locale), [today, locale]);
  return (
    <div
      className="px-4 py-4"
      style={{
        background: "var(--surface)",
        borderRadius: 24,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div key={d.iso} className="flex flex-col items-center gap-2">
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--ink-3)" }}
            >
              {d.weekday}
            </span>
            <span
              className="grid place-items-center text-base font-bold transition"
              style={{
                width: 36,
                height: d.isToday ? 44 : 36,
                borderRadius: d.isToday ? 18 : 999,
                background: d.isToday ? "var(--accent)" : "transparent",
                color: d.isToday ? "var(--ink)" : "var(--ink)",
                boxShadow: d.isToday
                  ? "0 6px 14px -6px rgba(255,168,51,0.55)"
                  : "none",
              }}
            >
              {d.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildWeek(today: Date, locale: string) {
  const wkLabels =
    locale === "th"
      ? ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"]
      : ["M", "T", "W", "T", "F", "S", "S"];
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  const todayKey = today.toDateString();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      iso: d.toISOString(),
      day: d.getDate(),
      weekday: wkLabels[i],
      isToday: d.toDateString() === todayKey,
    };
  });
}

/* ─── Mood History card (last 7 days dominant mood) ─── */

export function MoodHistoryCard({
  last7,
  pack,
}: {
  last7: { date: string; moodId: string | null }[];
  pack: string;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const wkLabels =
    locale === "th"
      ? ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <section
      className="px-5 py-5"
      style={{
        background: "var(--surface)",
        borderRadius: 28,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-label">{t("moodHistory")}</h2>
        <button
          aria-label="More"
          className="grid place-items-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            color: "var(--ink-3)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <circle cx="4" cy="9" r="1.5" fill="currentColor" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            <circle cx="14" cy="9" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="flex justify-between px-1">
        {last7.map((d) => {
          const date = new Date(d.date + "T00:00:00");
          const dow = (date.getDay() + 6) % 7;
          const mood = DEFAULT_MOODS.find((m) => m.id === d.moodId);
          return (
            <div key={d.date} className="flex flex-col items-center gap-2" style={{ minWidth: 0, flex: "1 1 0" }}>
              <DayCircle moodColor={mood?.color} moodId={d.moodId} pack={pack} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--ink-3)" }}
              >
                {wkLabels[dow]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DayCircle({
  moodColor,
  moodId,
  pack,
}: {
  moodColor?: string;
  moodId: string | null;
  pack: string;
}) {
  if (!moodId) {
    return (
      <span
        className="rounded-full grid place-items-center"
        style={{
          width: 48,
          height: 48,
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          fontSize: 16,
        }}
      >
        ·
      </span>
    );
  }
  const mood = DEFAULT_MOODS.find((m) => m.id === moodId);
  return (
    <span
      className="rounded-full grid place-items-center p-2"
      style={{
        width: 48,
        height: 48,
        background: moodColor ?? "var(--surface-2)",
      }}
    >
      <MoodIcon
        moodId={moodId}
        emoji={mood?.emoji}
        pack={pack}
        size={32}
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}

/* ─── Stat tile pair: Streak + Mood Today ─── */

export function StatTiles({
  streak,
  todayMood,
  pack,
}: {
  streak: number;
  todayMood: { moodId: string; createdAt: number } | null;
  pack: string;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const mood = todayMood
    ? DEFAULT_MOODS.find((m) => m.id === todayMood.moodId)
    : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Streak */}
      <div
        className="px-5 py-5 flex flex-col gap-3"
        style={{
          background: "var(--surface)",
          borderRadius: 24,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="card-label">{t("streak")}</span>
          <span style={{ fontSize: 20 }} aria-hidden>🔥</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="font-bold tracking-tight leading-none"
              style={{
                color: "var(--ink)",
                fontSize: "clamp(1.6rem, 3vw, 2rem)",
                letterSpacing: "-0.025em",
              }}
            >
              {streak}
            </span>
            {streak > 0 && <TealArrow />}
          </div>
          <div
            className="text-sm mt-1"
            style={{ color: "var(--ink-3)" }}
          >
            {locale === "th" ? t("streakUnitTh") : t("streakUnit", { count: streak })}
          </div>
        </div>
      </div>

      {/* Today's mood */}
      <div
        className="px-5 py-5 flex flex-col gap-3"
        style={{
          background: mood ? tint(mood.color, 0.78) : "var(--surface)",
          borderRadius: 24,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="card-label">{t("moodToday")}</span>
          {mood ? (
            <MoodIcon
              moodId={mood.id}
              emoji={mood.emoji}
              pack={pack}
              size={24}
            />
          ) : (
            <span style={{ fontSize: 18 }} aria-hidden>🌱</span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="font-bold tracking-tight leading-none truncate"
              style={{
                color: "var(--ink)",
                fontSize: "clamp(1.4rem, 2.6vw, 1.7rem)",
                letterSpacing: "-0.025em",
              }}
            >
              {mood
                ? locale === "th"
                  ? mood.labelTh
                  : mood.label
                : t("moodTodayEmpty")}
            </span>
            {mood && <TealArrow />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Teal positive indicator arrow ─── */

function TealArrow() {
  return (
    <span
      className="grid place-items-center shrink-0"
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        background: "var(--accent)",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M6 9V3M3.5 5.5L6 3l2.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/* ─── Mood Distribution Donut (30 days) ─── */

export function MoodDonut({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const t = useTranslations("home");
  const locale = useLocale();

  const slices = useMemo(() => {
    const entries = DEFAULT_MOODS.map((m) => ({
      mood: m,
      count: distribution[m.id] ?? 0,
    })).filter((s) => s.count > 0);
    return entries;
  }, [distribution]);

  const sum = slices.reduce((a, s) => a + s.count, 0);

  return (
    <section
      className="px-5 py-5"
      style={{
        background: "var(--surface)",
        borderRadius: 28,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="mb-4">
        <h2 className="card-label">{t("distribution")}</h2>
        <p
          className="text-sm mt-0.5"
          style={{ color: "var(--ink-3)" }}
        >
          {t("distributionSub", { count: total })}
        </p>
      </div>

      {sum === 0 ? (
        <p
          className="text-base py-6 text-center"
          style={{ color: "var(--ink-3)" }}
        >
          {t("distributionEmpty")}
        </p>
      ) : (
        <div className="flex items-center gap-5">
          <DonutSvg slices={slices} sum={sum} />
          <ul className="flex-1 space-y-1.5 min-w-0">
            {slices.map((s) => {
              const pct = Math.round((s.count / sum) * 100);
              return (
                <li
                  key={s.mood.id}
                  className="flex items-center gap-2.5 text-base"
                >
                  <span
                    aria-hidden
                    className="rounded-full shrink-0"
                    style={{
                      width: 10,
                      height: 10,
                      background: s.mood.color,
                    }}
                  />
                  <span
                    className="truncate flex-1"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {locale === "th" ? s.mood.labelTh : s.mood.label}
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--ink)" }}
                  >
                    {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function DonutSvg({
  slices,
  sum,
}: {
  slices: { mood: (typeof DEFAULT_MOODS)[number]; count: number }[];
  sum: number;
}) {
  const size = 132;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden
    >
      {/* track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth={stroke}
      />
      {slices.map((s) => {
        const len = (s.count / sum) * c;
        const dasharray = `${len - 2} ${c - len + 2}`;
        const dashoffset = -offset;
        offset += len;
        return (
          <circle
            key={s.mood.id}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.mood.color}
            strokeWidth={stroke}
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

/* ─── color util (shared with timeline) ─── */

function tint(hex: string, mix: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const tr = Math.round(r + (255 - r) * mix);
  const tg = Math.round(g + (255 - g) * mix);
  const tb = Math.round(b + (255 - b) * mix);
  return `rgb(${tr} ${tg} ${tb})`;
}
