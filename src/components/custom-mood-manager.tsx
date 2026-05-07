"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface MoodRow {
  id: string;
  userId: string | null;
  emoji: string;
  label: string;
  labelTh: string | null;
  color: string;
  isDefault: boolean;
}

export function CustomMoodManager() {
  const t = useTranslations("customMoods");
  const [moods, setMoods] = useState<MoodRow[]>([]);
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    fetch("/api/moods")
      .then((r) => r.json())
      .then((d) => setMoods((d as { moods: MoodRow[] }).moods));
  }
  useEffect(refresh, []);

  async function add() {
    setError(null);
    const res = await fetch("/api/moods", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emoji, label, color }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? "error");
      return;
    }
    setEmoji("");
    setLabel("");
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/moods/${id}`, { method: "DELETE" });
    refresh();
  }

  const custom = moods.filter((m) => !m.isDefault);

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">{t("title")}</h2>

      <div className="grid grid-cols-[60px_1fr_60px_auto] gap-2 items-center">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="😀"
          maxLength={4}
          className="rounded-lg border px-2 py-2 text-center text-xl"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("labelPlaceholder")}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-full rounded-lg border"
        />
        <button
          onClick={add}
          disabled={!emoji || !label}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("add")}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-2">
        {custom.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: `${m.color}40` }}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="flex-1 text-sm">{m.label}</span>
            <span className="h-4 w-4 rounded-full" style={{ background: m.color }} />
            <button
              onClick={() => remove(m.id)}
              className="text-xs text-zinc-400 hover:text-red-600"
            >
              {t("remove")}
            </button>
          </li>
        ))}
        {custom.length === 0 && (
          <li className="text-sm text-zinc-400">{t("empty")}</li>
        )}
      </ul>
    </div>
  );
}
