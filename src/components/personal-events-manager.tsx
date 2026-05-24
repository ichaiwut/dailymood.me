"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FREE_PERSONAL_EVENTS_LIMIT } from "@/lib/event-limits";

interface EventRow {
  id: string;
  label: string;
  labelTh: string | null;
  month: number;
  day: number;
  emoji: string;
}

const MONTH_NAMES_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EMOJI_OPTIONS = ["🎂", "🎉", "💍", "❤️", "🎓", "✈️", "🏠", "👶", "🐶", "⭐", "🎄", "🌸"];

export function PersonalEventsManager({ isPremium }: { isPremium: boolean }) {
  const locale = useLocale();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🎂");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  function refresh() {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents((d as { events: EventRow[] }).events));
  }
  useEffect(refresh, []);

  const atLimit = !isPremium && events.length >= FREE_PERSONAL_EVENTS_LIMIT;

  async function add() {
    setError(null);
    if (!label.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: label.trim(), month, day, emoji: emoji || "🎉" }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        if (j.error === "limit_reached") {
          setError(locale === "th" ? `ครบ ${FREE_PERSONAL_EVENTS_LIMIT} วันแล้ว อัปเกรด Premium เพื่อเพิ่มอีก` : `Reached ${FREE_PERSONAL_EVENTS_LIMIT} events. Upgrade to Premium for more.`);
        } else {
          setError(locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again.");
        }
        return;
      }
      setLabel("");
      setEmoji("🎉");
      setMonth(1);
      setDay(1);
      refresh();
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    refresh();
  }

  const monthNames = locale === "th" ? MONTH_NAMES_TH : MONTH_NAMES_EN;

  return (
    <div>
      <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 16 }}>
        {locale === "th"
          ? "เพิ่มวันสำคัญของคุณ เช่น วันเกิด ครบรอบแต่งงาน วันสำคัญจะแสดงบนปฏิทินทุกปี"
          : "Add your important dates like birthdays or anniversaries. They'll appear on your calendar every year."}
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
          placeholder={locale === "th" ? "ชื่อวันสำคัญ เช่น วันเกิด" : "Event name, e.g. Birthday"}
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

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 14,
            border: "1.5px solid var(--hairline-2)", background: "var(--surface-2)",
            fontSize: 15, color: "var(--ink)", fontFamily: "inherit",
            appearance: "none", cursor: "pointer",
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{monthNames[i]}</option>
          ))}
        </select>
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          style={{
            width: 80, padding: "10px 14px", borderRadius: 14,
            border: "1.5px solid var(--hairline-2)", background: "var(--surface-2)",
            fontSize: 15, color: "var(--ink)", fontFamily: "inherit",
            appearance: "none", cursor: "pointer",
          }}
        >
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
      </div>

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
        {locale === "th" ? "เพิ่มวันสำคัญ" : "Add event"}
      </button>

      {error && (
        <div style={{ fontSize: 14, color: "#D94444", marginTop: 8 }}>{error}</div>
      )}

      {/* Premium teaser for free users at limit */}
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
                {locale === "th" ? "เพิ่มวันสำคัญได้ไม่จำกัด" : "Unlimited special days"}
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#A673F1" }}>
              {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
            </span>
          </div>
        </Link>
      )}

      {/* Events list */}
      <div style={{ marginTop: 16 }}>
        {events.map((e) => (
          <div
            key={e.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {e.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                {locale === "th" ? (e.labelTh ?? e.label) : e.label}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
                {e.day} {monthNames[e.month - 1]}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(e.id)}
              style={{
                fontSize: 14, color: "var(--ink-3)", background: "none",
                border: "none", cursor: "pointer", padding: "4px 8px",
              }}
            >
              {locale === "th" ? "ลบ" : "Remove"}
            </button>
          </div>
        ))}
        {events.length === 0 && (
          <div style={{ fontSize: 14, color: "var(--ink-3)", padding: "12px 0" }}>
            {locale === "th" ? "ยังไม่มีวันสำคัญ" : "No special days yet"}
          </div>
        )}
      </div>
    </div>
  );
}
