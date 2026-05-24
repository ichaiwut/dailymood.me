"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FREE_ACTIVITY_LIMIT } from "@/lib/activity-limits";

interface ActivityRow {
  id: string;
  userId: string | null;
  emoji: string;
  label: string;
  labelTh: string | null;
  isDefault: boolean;
}

const EMOJI_OPTIONS = ["🏋️", "🎵", "🛒", "🧘", "🎨", "🏊", "🚗", "🧑‍💻", "🎤", "📱", "🐶", "☕"];

export function ActivityManager({ isPremium }: { isPremium: boolean }) {
  const locale = useLocale();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("⚡");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  function refresh() {
    fetch("/api/activities")
      .then((r) => r.json())
      .then((d) => setActivities((d as { activities: ActivityRow[] }).activities));
  }
  useEffect(refresh, []);

  const custom = activities.filter((a) => !a.isDefault);
  const atLimit = !isPremium && custom.length >= FREE_ACTIVITY_LIMIT;

  async function add() {
    setError(null);
    if (!label.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: label.trim(), emoji: emoji || "⚡" }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        if (j.error === "limit_reached") {
          setError(locale === "th" ? `ครบ ${FREE_ACTIVITY_LIMIT} กิจกรรมแล้ว อัปเกรด Premium เพื่อเพิ่มอีก` : `Reached ${FREE_ACTIVITY_LIMIT} activities. Upgrade to Premium for more.`);
        } else {
          setError(locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again.");
        }
        return;
      }
      setLabel("");
      setEmoji("⚡");
      refresh();
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 16 }}>
        {locale === "th"
          ? "เพิ่มกิจกรรมที่คุณทำบ่อย เพื่อเลือกตอนบันทึกอารมณ์"
          : "Add activities you do often, to pick when logging your mood."}
      </div>

      {/* Default activities list */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 8, letterSpacing: 0.3 }}>
        {locale === "th" ? "กิจกรรมเริ่มต้น" : "DEFAULT"}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {activities.filter((a) => a.isDefault).map((a) => (
          <span key={a.id} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "6px 12px", borderRadius: 100,
            background: "var(--surface-2)", fontSize: 14, color: "var(--ink)",
          }}>
            {a.emoji} {locale === "th" ? (a.labelTh ?? a.label) : a.label}
          </span>
        ))}
      </div>

      {/* Custom activities header */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 8, letterSpacing: 0.3 }}>
        {locale === "th" ? `กิจกรรมของคุณ (${custom.length}${isPremium ? "/100" : `/${FREE_ACTIVITY_LIMIT}`})` : `YOUR ACTIVITIES (${custom.length}${isPremium ? "/100" : `/${FREE_ACTIVITY_LIMIT}`})`}
      </div>

      {/* Add form */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
          style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            border: "1.5px solid var(--hairline-2)", background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, cursor: "pointer",
          }}
        >
          {emoji}
        </button>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={locale === "th" ? "ชื่อกิจกรรม เช่น โยคะ" : "Activity name, e.g. Yoga"}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 14,
            border: "1.5px solid var(--hairline-2)", background: "var(--surface-2)",
            fontSize: 15, color: "var(--ink)", outline: "none", fontFamily: "inherit",
            minWidth: 0,
          }}
        />
      </div>

      {emojiPickerOpen && (
        <div style={{
          display: "flex", gap: 6, flexWrap: "wrap",
          padding: 12, marginBottom: 10,
          background: "var(--surface-2)", borderRadius: 14,
          border: "1.5px solid var(--hairline)",
        }}>
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { setEmoji(e); setEmojiPickerOpen(false); }}
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: emoji === e ? "2px solid var(--primary)" : "1.5px solid var(--hairline)",
                background: "var(--surface)",
                fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        disabled={!label.trim() || adding || atLimit}
        style={{
          width: "100%", padding: "12px 0", borderRadius: 14,
          border: "none",
          background: label.trim() && !atLimit ? "var(--primary)" : "var(--hairline)",
          fontSize: 14, fontWeight: 700,
          color: label.trim() && !atLimit ? "#fff" : "var(--ink-3)",
          cursor: label.trim() && !atLimit ? "pointer" : "default",
          marginBottom: 4,
        }}
      >
        {locale === "th" ? "เพิ่มกิจกรรม" : "Add activity"}
      </button>

      {error && (
        <div style={{ fontSize: 14, color: "#D94444", marginTop: 8 }}>{error}</div>
      )}

      {atLimit && (
        <Link
          href={"/profile/subscription" as "/"}
          style={{
            display: "block", textDecoration: "none", marginTop: 12,
            background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 100%)",
            borderRadius: 16, padding: "14px 18px",
          }}
        >
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#A673F1",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff", flexShrink: 0,
            }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.4, color: "#A673F1" }}>PREMIUM</div>
              <div style={{ fontSize: 14, color: "var(--ink)" }}>
                {locale === "th" ? "เพิ่มกิจกรรมได้ถึง 100 อัน" : "Add up to 100 activities"}
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1" }}>
              {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
            </span>
          </div>
        </Link>
      )}

      {/* Custom activities list */}
      <div style={{ marginTop: 16 }}>
        {custom.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "#E0F2FE",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {a.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                {locale === "th" ? (a.labelTh ?? a.label) : a.label}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(a.id)}
              style={{
                fontSize: 14, color: "var(--ink-3)", background: "none",
                border: "none", cursor: "pointer", padding: "4px 8px",
              }}
            >
              {locale === "th" ? "ลบ" : "Remove"}
            </button>
          </div>
        ))}
        {custom.length === 0 && (
          <div style={{ fontSize: 14, color: "var(--ink-3)", padding: "12px 0" }}>
            {locale === "th" ? "ยังไม่มีกิจกรรมที่สร้างเอง" : "No custom activities yet"}
          </div>
        )}
      </div>
    </div>
  );
}
