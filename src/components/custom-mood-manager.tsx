"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { R2_PUBLIC_URL } from "@/lib/moods";

const CUSTOM_EMOJI_KEYS = Array.from({ length: 50 }, (_, i) => {
  const row = Math.floor(i / 10) + 1;
  const col = (i % 10) + 1;
  return `custom-emojis/emoji_${row}_${String(col).padStart(2, "0")}.png`;
});

interface MoodRow {
  id: string;
  userId: string | null;
  emoji: string;
  label: string;
  labelTh: string | null;
  color: string;
  isDefault: boolean;
  iconKey: string | null;
}

export function CustomMoodManager() {
  const t = useTranslations("customMoods");
  const locale = useLocale();
  const [moods, setMoods] = useState<MoodRow[]>([]);
  const [emoji, setEmoji] = useState("");
  const [iconKey, setIconKey] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function refresh() {
    fetch("/api/moods")
      .then((r) => r.json())
      .then((d) => setMoods((d as { moods: MoodRow[] }).moods));
  }
  useEffect(refresh, []);

  async function add() {
    setError(null);
    if (!label || (!emoji && !iconKey)) return;
    const res = await fetch("/api/moods", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        emoji: emoji || "🙂",
        label,
        color,
        iconKey: iconKey ?? undefined,
      }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? "error");
      return;
    }
    setEmoji("");
    setIconKey(null);
    setLabel("");
    setPickerOpen(false);
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/moods/${id}`, { method: "DELETE" });
    refresh();
  }

  const custom = moods.filter((m) => !m.isDefault);

  return (
    <div>
      {/* Helper text */}
      <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 16 }}>
        {locale === "th"
          ? "สร้างอารมณ์ของคุณเอง — เลือกไอคอน ตั้งชื่อ แล้วเลือกสีพื้นหลังที่จะแสดงบนหน้าบันทึก"
          : "Create your own mood — pick an icon, name it, and choose a background color for the mood card"}
      </div>

      {/* Icon selector button */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            border: "2px solid var(--hairline-2)",
            background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, cursor: "pointer",
          }}
        >
          {iconKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${R2_PUBLIC_URL}/${iconKey}`} alt="" width={36} height={36} style={{ borderRadius: 8 }} />
          ) : emoji ? (
            emoji
          ) : (
            <span style={{ fontSize: 20, color: "var(--ink-3)" }}>+</span>
          )}
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("labelPlaceholder")}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 14,
              border: "1.5px solid var(--hairline-2)", background: "var(--surface-2)",
              fontSize: 15, color: "var(--ink)", outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
        <label style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          border: "1.5px solid var(--hairline-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: color,
          }} />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              position: "absolute", inset: 0, opacity: 0, cursor: "pointer",
            }}
          />
        </label>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={add}
        disabled={!label || (!emoji && !iconKey)}
        style={{
          width: "100%", padding: "12px 0", borderRadius: 14,
          border: "none",
          background: label && (emoji || iconKey) ? "var(--primary)" : "var(--hairline)",
          fontSize: 14, fontWeight: 700,
          color: label && (emoji || iconKey) ? "#fff" : "var(--ink-3)",
          cursor: label && (emoji || iconKey) ? "pointer" : "default",
          marginBottom: 4,
        }}
      >
        {t("add")}
      </button>

      {error && (
        <div style={{ fontSize: 14, color: "#D94444", marginTop: 8 }}>{error}</div>
      )}

      {/* Icon picker grid */}
      {pickerOpen && (
        <div style={{
          marginTop: 12, padding: 16,
          background: "var(--surface-2)", borderRadius: 18,
          border: "1.5px solid var(--hairline)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10, letterSpacing: 0.3 }}>
            {locale === "th" ? "เลือกไอคอน" : "PICK AN ICON"}
          </div>

          {/* Text emoji input */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input
              value={emoji}
              onChange={(e) => { setEmoji(e.target.value); if (e.target.value) setIconKey(null); }}
              placeholder="😀"
              maxLength={4}
              style={{
                width: 52, padding: "8px 0", borderRadius: 12,
                border: iconKey ? "1.5px solid var(--hairline)" : "2px solid var(--primary)",
                background: "var(--surface)", textAlign: "center",
                fontSize: 22, outline: "none",
              }}
            />
            <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
              {locale === "th" ? "หรือเลือกจากด้านล่าง" : "or pick below"}
            </span>
          </div>

          {/* R2 emoji grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6,
            maxHeight: 240, overflowY: "auto",
          }}>
            {CUSTOM_EMOJI_KEYS.map((key) => {
              const selected = iconKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setIconKey(key); setEmoji(""); setPickerOpen(false); }}
                  style={{
                    width: "100%", aspectRatio: "1", borderRadius: 12,
                    border: selected ? "2.5px solid var(--primary)" : "1.5px solid var(--hairline)",
                    background: "var(--surface)",
                    display: "grid", placeItems: "center",
                    cursor: "pointer", padding: 4,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${R2_PUBLIC_URL}/${key}`}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 6 }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom moods list */}
      <div style={{ marginTop: 16 }}>
        {custom.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${m.color}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {m.iconKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${R2_PUBLIC_URL}/${m.iconKey}`} alt="" width={28} height={28} style={{ borderRadius: 6 }} />
              ) : (
                <span style={{ fontSize: 22 }}>{m.emoji}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{m.label}</div>
            </div>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
            <button
              type="button"
              onClick={() => remove(m.id)}
              style={{
                fontSize: 14, color: "var(--ink-3)", background: "none",
                border: "none", cursor: "pointer", padding: "4px 8px",
              }}
            >
              {t("remove")}
            </button>
          </div>
        ))}
        {custom.length === 0 && (
          <div style={{ fontSize: 14, color: "var(--ink-3)", padding: "12px 0" }}>{t("empty")}</div>
        )}
      </div>
    </div>
  );
}
