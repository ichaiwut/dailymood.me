"use client";

import { useEffect, useState } from "react";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { R2_PUBLIC_URL } from "@/lib/moods";
import { useTranslations, useLocale } from "next-intl";
import { SmartLogModal } from "./smart-log-modal";
import { MoodTimeline } from "./mood-timeline";
import { GuestTimeline } from "./guest-timeline";

type Tier = "guest" | "free" | "premium";

interface Props {
  tier: Tier;
}

const GUEST_TTL_MS = 24 * 60 * 60 * 1000;

interface GuestEntry {
  moodId: string;
  note: string;
  timestamp: number;
}

type CustomMood = { id: string; emoji: string; label: string; labelTh: string | null; color: string; iconKey: string | null };

export function MoodPicker({ tier }: Props) {
  const t = useTranslations("home");
  const locale = useLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSmart, setShowSmart] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [customMoods, setCustomMoods] = useState<CustomMood[]>([]);

  useEffect(() => {
    if (tier === "guest") return;
    fetch("/api/moods").then((r) => r.ok ? r.json() : { moods: [] }).then((d) => {
      const moods = (d as { moods: (CustomMood & { isDefault: boolean })[] }).moods;
      setCustomMoods(moods.filter((m) => !m.isDefault));
    });
  }, [tier]);

  const allMoods = [...DEFAULT_MOODS.map((m) => ({ ...m, iconKey: null as string | null })), ...customMoods];
  const selectedMood = allMoods.find((m) => m.id === selected);

  async function handleSave() {
    if (!selected || saving) return;
    setSaving(true);

    if (tier === "guest") {
      const stored: Record<string, GuestEntry> = JSON.parse(
        localStorage.getItem("mood_entries") || "{}",
      );
      const now = Date.now();
      for (const k of Object.keys(stored)) {
        if (now - stored[k].timestamp > GUEST_TTL_MS) delete stored[k];
      }
      stored[`${now}`] = { moodId: selected, note, timestamp: now };
      localStorage.setItem("mood_entries", JSON.stringify(stored));
    } else {
      await fetch("/api/log/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moodTypeId: selected, note }),
      });
    }

    setNote("");
    setSelected(null);
    setRefreshKey((k) => k + 1);
    setSaving(false);
  }

  return (
    <div>
      {/* mood selector card */}
      <section className="card p-5 sm:p-6 fade-in">
        <p
          className="text-sm font-medium mb-4"
          style={{ color: "var(--ink-2)" }}
        >
          {t("selectMood")}
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {allMoods.map((mood) => {
            const isActive = selected === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => setSelected(mood.id)}
                aria-label={(locale === "th" ? mood.labelTh : mood.label) ?? mood.label}
                className="flex flex-col items-center gap-1.5 group"
              >
                <span
                  className="mood-disc transition"
                  style={{
                    width: 56,
                    height: 56,
                    fontSize: 30,
                    background: `${mood.color}26`,
                    boxShadow: isActive
                      ? `0 0 0 3px var(--bg), 0 0 0 5.5px ${mood.color}`
                      : "none",
                    transform: isActive ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  {mood.iconKey
                    ? <img src={`${R2_PUBLIC_URL}/${mood.iconKey}`} alt="" width={30} height={30} />
                    : mood.emoji}
                </span>
                <span
                  className="text-[11px] sm:text-xs font-medium"
                  style={{
                    color: isActive ? "var(--ink)" : "var(--ink-2)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {(locale === "th" ? mood.labelTh : mood.label) ?? mood.label}
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-5 fade-in">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("addNote")}
              rows={3}
              className="w-full resize-none px-4 py-3 text-base focus:outline-none"
              style={{
                background: "var(--surface-2)",
                color: "var(--ink)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--hairline)",
              }}
            />
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => {
                  setSelected(null);
                  setNote("");
                }}
                className="btn-ghost flex-shrink-0"
                style={{ width: "auto", padding: "0.85rem 1.2rem" }}
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                style={{
                  background: selectedMood?.color
                    ? "var(--primary)"
                    : "var(--primary)",
                }}
              >
                {saving ? t("saving") : t("saveMood")} →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* smart log entry */}
      {tier !== "guest" && !selected && (
        <button
          onClick={() => setShowSmart(true)}
          className="card mt-3 w-full p-4 flex items-center gap-3 text-left transition hover:scale-[0.995] active:scale-[0.99]"
        >
          <span
            aria-hidden
            className="mood-disc"
            style={{
              width: 44,
              height: 44,
              background: "var(--accent-soft)",
              fontSize: 20,
            }}
          >
            ✨
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              {t("smartLog")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
              {t("smartLogHint")}
            </p>
          </div>
          <span style={{ color: "var(--ink-3)", fontSize: 20 }}>›</span>
        </button>
      )}

      {/* timeline */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2
            className="text-base font-bold"
            style={{ color: "var(--ink)" }}
          >
            {t("today")}
          </h2>
          {tier === "guest" && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#FFF4EB", color: "#FCA45B" }}
            >
              {t("guestNoticeShort")}
            </span>
          )}
        </div>
        {tier === "guest" ? (
          <GuestTimeline refreshKey={refreshKey} />
        ) : (
          <MoodTimeline refreshKey={refreshKey} />
        )}
      </section>

      {showSmart && (
        <SmartLogModal
          tier={tier}
          onClose={() => setShowSmart(false)}
          onSaved={() => {
            setShowSmart(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
