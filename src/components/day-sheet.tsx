"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { type SheetEntry } from "./entry-mini-card";
import { AiDisclaimer } from "./ai-disclaimer";
import { SpecialDayBanner } from "./special-day-banner";
import { PASticker } from "./paper/pa-sticker";
import type { SpecialDay } from "@/db/schema";

interface DaySheetProps {
  selectedDate: string;
  viewYear: number;
  viewMonth: number;
  onClose: () => void;
  onNavigate: (date: string) => void;
  onOpenLog: (date: string) => void;
  pack?: string;
  iconFormat?: string;
  specialDays?: SpecialDay[];
}

function parseDay(dateStr: string): number {
  return parseInt(dateStr.slice(8, 10), 10);
}

export function DaySheet({
  selectedDate,
  viewYear,
  viewMonth,
  onClose,
  onOpenLog,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
  specialDays,
}: DaySheetProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("daySheet");
  const [entries, setEntries] = useState<SheetEntry[] | null>(null);

  const day = parseDay(selectedDate);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isFuture = new Date(viewYear, viewMonth, day) > todayMidnight;

  const displayDate = new Date(selectedDate + "T12:00:00");
  const weekday = displayDate.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "long" });
  const monthDay = displayDate.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long", day: "numeric" });

  useEffect(() => {
    let alive = true;
    setEntries(null);
    fetch(`/api/log?date=${selectedDate}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        setEntries((data as { entries: SheetEntry[] } | null)?.entries ?? []);
      });
    return () => { alive = false; };
  }, [selectedDate]);

  return (
    <div className="fade-in" style={{ padding: "28px 28px 32px", position: "relative" }}>
      <button
        onClick={onClose}
        aria-label={locale === "th" ? "ปิด" : "Close"}
        style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "var(--w-tint)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M1 1l12 12M13 1L1 13" stroke="var(--w-ink-2)" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>

      {/* Loading */}
      {entries === null ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div className="ai-spin" style={{ width: 32, height: 32, margin: "0 auto 12px", borderRadius: "50%", border: "3px solid var(--w-rule)", borderTopColor: "var(--purple)" }} />
        </div>
      ) : entries.length > 0 ? (
        /* ═══ HAS ENTRIES ═══ */
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--peach)", marginBottom: 4 }}>{weekday}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--w-ink)", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: specialDays && specialDays.length > 0 ? 12 : 24 }}>{monthDay}</div>

          {specialDays && <SpecialDayBanner days={specialDays} locale={locale} />}

          {entries.map((e, idx) => {
            const m = DEFAULT_MOODS.find((d) => d.id === e.moodTypeId);
            const ml = m ? (locale === "th" ? m.labelTh : m.label) : "—";
            const tm = new Date(e.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={e.id}>
                {idx > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--w-rule)" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-3)", flexShrink: 0 }}>{tm}</span>
                    <div style={{ flex: 1, height: 1, background: "var(--w-rule)" }} />
                  </div>
                )}
                {/* Mood card */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 16, border: "1.5px solid var(--w-rule)", marginBottom: 20 }}>
                  {m && <PASticker moodId={m.id} color={m.color} size={42} borderWidth={3} pack={pack} iconFormat={iconFormat} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--w-ink)" }}>{ml}</div>
                    <div style={{ fontSize: 14, color: "var(--w-ink-3)" }}>{tm}</div>
                  </div>
                  <button
                    onClick={() => router.push(`/entry/${e.id}/edit` as "/")}
                    style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid var(--w-rule)", background: "#fff", fontSize: 14, fontWeight: 800, color: "var(--w-ink-2)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {locale === "th" ? "แก้ไข" : "Edit"}
                  </button>
                </div>

                {/* Note */}
                {e.note && (
                  <div style={{ padding: "18px 20px", borderRadius: 16, background: "var(--w-tint)", marginBottom: 20, fontSize: 15, lineHeight: 1.65, color: "var(--w-ink)" }}>
                    &ldquo;{e.note}&rdquo;
                  </div>
                )}

                {/* Image */}
                {e.imageUrl && (
                  <img src={e.imageUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 12, background: "var(--w-tint)", marginBottom: 20 }} />
                )}

                {/* Tags */}
                {e.tags && e.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {e.tags.map((tag, i) => (
                      <span key={i} style={{ padding: "8px 16px", borderRadius: 100, background: "var(--w-tint)", fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)" }}>#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Location */}
                {e.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="var(--w-ink-3)" /></svg>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink-2)" }}>{e.location}</span>
                  </div>
                )}

                {/* AI insight */}
                {e.aiSummary && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="var(--purple-strong)" /></svg>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--w-ink-2)" }}>
                      <span style={{ fontWeight: 800, color: "var(--purple-strong)" }}>AI: </span>
                      {e.aiSummary}
                      <div style={{ marginTop: 6 }}><AiDisclaimer variant="analysis" /></div>
                    </div>
                  </div>
                )}

                {/* View full entry */}
                <button
                  onClick={() => router.push(`/entry/${e.id}` as "/")}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1.5px solid var(--w-rule)", background: "#fff", fontSize: 14, fontWeight: 800, color: "var(--w-ink-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: idx < entries.length - 1 ? 24 : 0, fontFamily: "inherit" }}
                >
                  {locale === "th" ? "ดูบันทึกเต็ม" : "View full entry"} →
                </button>
              </div>
            );
          })}
        </div>
      ) : isFuture ? (
        /* ═══ FUTURE ═══ */
        <div style={{ padding: "32px 24px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔮</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--w-ink)", marginBottom: 8 }}>{locale === "th" ? "ยังมาไม่ถึง" : "Not yet"}</div>
          <p style={{ fontSize: 15, color: "var(--w-ink-2)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px", whiteSpace: "pre-line" }}>
            {locale === "th"
              ? `วัน ${day} ${displayDate.toLocaleDateString("th-TH", { month: "long" })} ยังเป็นอนาคต\nบันทึกได้เฉพาะ "ตอนนี้" หรือย้อนหลัง`
              : `${monthDay} is in the future.\nYou can only log today or past days.`}
          </p>
          <button disabled style={{ padding: "10px 24px", borderRadius: 100, border: "1.5px solid var(--w-rule)", background: "var(--w-tint)", fontSize: 14, fontWeight: 800, color: "var(--w-ink-3)", cursor: "not-allowed", fontFamily: "inherit" }}>
            🔒 {locale === "th" ? "ยังบันทึกไม่ได้" : "Can't log yet"}
          </button>
          <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, background: "var(--w-tint)" }}>
            <span style={{ fontSize: 14, color: "var(--w-ink-2)" }}>
              💡 {locale === "th" ? "Tip: ตั้ง reminder ให้บันทึกตอนเย็น 21:00" : "Tip: Set a reminder to log at 9 PM"}
            </span>
          </div>
        </div>
      ) : (
        /* ═══ EMPTY PAST ═══ */
        <div style={{ padding: "32px 24px 40px", textAlign: "center" }}>
          {specialDays && <SpecialDayBanner days={specialDays} locale={locale} />}
          <div style={{ fontSize: 56, marginBottom: 16 }}>🤔</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--w-ink)", marginBottom: 8 }}>{locale === "th" ? "ไม่มีบันทึก" : "No entry"}</div>
          <p style={{ fontSize: 15, color: "var(--w-ink-2)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto 24px", whiteSpace: "pre-line" }}>
            {locale === "th"
              ? `วัน ${day} ${displayDate.toLocaleDateString("th-TH", { month: "long" })} ยังไม่ได้บันทึก\nย้อนกลับไปเพิ่มได้นะ จำได้แค่ไหนก็เขียนเท่านั้น`
              : `${monthDay} has no entry yet.\nYou can still add one — write whatever you remember.`}
          </p>
          <button onClick={() => onOpenLog(selectedDate)} className="pa-btn" style={{ height: 46, padding: "0 26px" }}>
            + {locale === "th" ? "เพิ่มย้อนหลัง" : "Add retroactively"}
          </button>
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 14, color: "var(--w-ink-3)" }}>
              {locale === "th" ? "หรือ " : "or "}
              <a href="/settings" style={{ color: "var(--purple-strong)", fontWeight: 800, textDecoration: "none" }}>
                {locale === "th" ? "ตั้งเตือนทุกวัน" : "set daily reminder"}
              </a>
              {locale === "th" ? " เพื่อกันลืม" : " so you don't forget"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
