"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";
import { EntryMiniCard, type SheetEntry } from "./entry-mini-card";

interface DaySheetProps {
  selectedDate: string;
  viewYear: number;
  viewMonth: number;
  onClose: () => void;
  onNavigate: (date: string) => void;
  onOpenLog: (date: string) => void;
  pack?: string;
  iconFormat?: string;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDay(dateStr: string): number {
  return parseInt(dateStr.slice(8, 10), 10);
}

export function DaySheet({
  selectedDate,
  viewYear,
  viewMonth,
  onClose,
  onNavigate,
  onOpenLog,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
}: DaySheetProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("daySheet");
  const [entries, setEntries] = useState<SheetEntry[] | null>(null);

  const day = parseDay(selectedDate);
  const total = daysInMonth(viewYear, viewMonth);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isFuture = new Date(viewYear, viewMonth, day) > todayMidnight;

  const displayDate = new Date(selectedDate + "T12:00:00");
  const weekday = displayDate.toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { weekday: "long" },
  );
  const monthDay = displayDate.toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { month: "long", day: "numeric" },
  );

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

  const fe = entries && entries.length > 0 ? entries[0] : null;
  const feMood = fe ? DEFAULT_MOODS.find((m) => m.id === fe.moodTypeId) : null;
  const feLabel = feMood ? (locale === "th" ? feMood.labelTh : feMood.label) : null;
  const feTime = fe ? new Date(fe.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="card fade-in" style={{ padding: "28px 28px 32px", overflow: "hidden" }}>

      {/* Loading */}
      {entries === null ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div className="ai-spin" style={{ width: 32, height: 32, margin: "0 auto 12px", borderRadius: "50%", border: "3px solid var(--hairline)", borderTopColor: "var(--purple)" }} />
        </div>
      ) : entries.length > 0 ? (
        /* ═══ STATE 1: HAS ENTRIES ═══ */
        <div>
          {/* Date header */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--peach)", marginBottom: 4 }}>{weekday}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1.15, marginBottom: 24 }}>{monthDay}</div>

          {entries.map((e, idx) => {
            const m = DEFAULT_MOODS.find((d) => d.id === e.moodTypeId);
            const ml = m ? (locale === "th" ? m.labelTh : m.label) : "—";
            const tm = new Date(e.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={e.id} style={{ marginBottom: idx < entries.length - 1 ? 24 : 0, paddingBottom: idx < entries.length - 1 ? 24 : 0, borderBottom: idx < entries.length - 1 ? "none" : "none" }}>
                {idx > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--hairline-2)" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", flexShrink: 0 }}>{tm}</span>
                    <div style={{ flex: 1, height: 1, background: "var(--hairline-2)" }} />
                  </div>
                )}
                {/* Mood card */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 16, border: "1.5px solid var(--hairline)", marginBottom: 20 }}>
                  {m && <img src={moodIconUrl(m.id, pack, iconFormat)} alt="" width={40} height={40} style={{ flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{ml}</div>
                    <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{tm}</div>
                  </div>
                  <button
                    onClick={() => router.push(`/entry/${e.id}/edit` as "/")}
                    style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid var(--hairline)", background: "#fff", fontSize: 14, fontWeight: 700, color: "var(--ink)", cursor: "pointer" }}
                  >
                    {locale === "th" ? "แก้ไข" : "Edit"}
                  </button>
                </div>

                {/* Note */}
                {e.note && (
                  <div style={{ padding: "18px 20px", borderRadius: 16, background: "var(--surface-2)", marginBottom: 20, fontSize: 15, lineHeight: 1.65, color: "var(--ink)" }}>
                    &ldquo;{e.note}&rdquo;
                  </div>
                )}

                {/* Image */}
                {e.imageUrl && (
                  <img src={e.imageUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 12, background: "var(--surface-2)", marginBottom: 20 }} />
                )}

                {/* Tags */}
                {e.tags && e.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {e.tags.map((tag, i) => (
                      <span key={i} style={{ padding: "8px 16px", borderRadius: 100, background: "var(--surface-2)", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                        # {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI insight */}
                {e.aiSummary && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="var(--purple)" />
                    </svg>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>
                      <span style={{ fontWeight: 700, color: "var(--purple)" }}>AI: </span>
                      {e.aiSummary}
                    </div>
                  </div>
                )}

                {/* View full entry link */}
                <button
                  onClick={() => router.push(`/entry/${e.id}` as "/")}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1.5px solid var(--hairline)", background: "#fff", fontSize: 14, fontWeight: 700, color: "var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  {locale === "th" ? "ดูบันทึกเต็ม" : "View full entry"} →
                </button>
              </div>
            );
          })}
        </div>
      ) : isFuture ? (
        /* ═══ STATE 3: FUTURE ═══ */
        <div style={{ padding: "32px 24px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔮</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
            {locale === "th" ? "ยังมาไม่ถึง" : "Not yet"}
          </div>
          <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            {locale === "th"
              ? `วัน ${parseDay(selectedDate)} ${displayDate.toLocaleDateString("th-TH", { month: "long" })} ยังเป็นอนาคต\nบันทึกได้เฉพาะ "ตอนนี้" หรือย้อนหลัง`
              : `${monthDay} is in the future.\nYou can only log today or past days.`}
          </p>
          <button disabled style={{ padding: "10px 24px", borderRadius: 100, border: "1.5px solid var(--hairline)", background: "var(--surface-2)", fontSize: 14, fontWeight: 700, color: "var(--ink-3)", cursor: "not-allowed" }}>
            🔒 {locale === "th" ? "ยังบันทึกไม่ได้" : "Can't log yet"}
          </button>
          <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, background: "#FFF8F0", border: "1px solid #FDE8DA" }}>
            <span style={{ fontSize: 14, color: "var(--ink-2)" }}>
              💡 {locale === "th" ? "Tip: ตั้ง reminder ให้บันทึกตอนเย็น 21:00" : "Tip: Set a reminder to log at 9 PM"}
            </span>
          </div>
        </div>
      ) : (
        /* ═══ STATE 2: EMPTY PAST ═══ */
        <div style={{ padding: "32px 24px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🤔</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
            {locale === "th" ? "ไม่มีบันทึก" : "No entry"}
          </div>
          <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto 24px" }}>
            {locale === "th"
              ? `วัน ${parseDay(selectedDate)} ${displayDate.toLocaleDateString("th-TH", { month: "long" })} ยังไม่ได้บันทึก\nย้อนกลับไปเพิ่มได้นะ จำได้แค่ไหนก็เขียนเท่านั้น`
              : `${monthDay} has no entry yet.\nYou can still add one — write whatever you remember.`}
          </p>
          <button
            onClick={() => onOpenLog(selectedDate)}
            style={{ padding: "12px 28px", borderRadius: 100, background: "var(--peach)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px -4px rgba(252,164,91,0.4)" }}
          >
            + {locale === "th" ? "เพิ่มย้อนหลัง" : "Add retroactively"}
          </button>
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
              {locale === "th" ? "หรือ " : "or "}
              <a href="/settings" style={{ color: "var(--purple)", fontWeight: 700, textDecoration: "none" }}>
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
