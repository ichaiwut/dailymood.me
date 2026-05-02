"use client";

import { useState } from "react";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { useTranslations, useLocale } from "next-intl";

interface MoodEntry {
  moodId: string;
  note: string;
}

export function MoodPicker() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!selected) return;

    const entry: MoodEntry = { moodId: selected, note };
    // Save to localStorage for now (guest mode / before DB is connected)
    const today = new Date().toISOString().split("T")[0];
    const stored = JSON.parse(localStorage.getItem("mood_entries") || "{}");
    stored[today] = { ...entry, timestamp: Date.now() };
    localStorage.setItem("mood_entries", JSON.stringify(stored));

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const selectedMood = DEFAULT_MOODS.find((m) => m.id === selected);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Mood Grid */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {DEFAULT_MOODS.map((mood) => {
          const isActive = selected === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => setSelected(mood.id)}
              className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition-all duration-200"
              style={{
                background: isActive ? `${mood.color}20` : "transparent",
                boxShadow: isActive ? `0 0 0 2px ${mood.color}` : "none",
              }}
            >
              <span className={`text-4xl transition-transform duration-200 ${isActive ? "scale-125" : "group-hover:scale-110"}`}>
                {mood.emoji}
              </span>
              <span className={`text-xs font-medium transition-colors ${isActive ? "text-white" : "text-zinc-400"}`}>
                {locale === "th" ? mood.labelTh : mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Note Input */}
      {selected && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            className="rounded-2xl p-4 transition-colors"
            style={{ background: `${selectedMood?.color}10` }}
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("addNote")}
              rows={3}
              className="w-full resize-none rounded-xl border-0 bg-transparent p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saved}
            className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: selectedMood?.color }}
          >
            {saved ? t("saved") : t("saveMood")}
          </button>
        </div>
      )}
    </div>
  );
}
