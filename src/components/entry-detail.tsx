"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";
import { AiDisclaimer } from "./ai-disclaimer";

interface EntryData {
  id: string;
  moodTypeId: string;
  note: string | null;
  tags?: string[] | null;
  sentiment: number | null;
  aiSummary?: string | null;
  aiSource: string;
  imageUrl?: string | null;
  isPremium?: boolean;
  entryNumber?: number;
  date: string;
  createdAt: string | number;
}

interface NearbyDay {
  date: string;
  moodTypeId: string | null;
  note: string | null;
}

const MOOD_SCORES: Record<string, number> = {
  amazing: 10, happy: 8, neutral: 6, sad: 4, angry: 2, anxious: 3, tired: 3,
};

export function EntryDetail({ id, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: { id: string; pack?: string; iconFormat?: string }) {
  const locale = useLocale();
  const t = useTranslations("entry");
  const router = useRouter();
  const th = locale === "th";
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearby, setNearby] = useState<NearbyDay[]>([]);
  const [lastYear, setLastYear] = useState<NearbyDay | null>(null);
  const [streak, setStreak] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/log/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        const d = data as (EntryData & { nearby?: NearbyDay[]; lastYear?: NearbyDay | null; streak?: number }) | null;
        setEntry(d);
        if (d?.nearby) setNearby(d.nearby);
        if (d?.lastYear) setLastYear(d.lastYear);
        if (d?.streak) setStreak(d.streak);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const res = await fetch(`/api/log/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/calendar" as "/");
    setDeleting(false);
  }

  if (loading) return <LoadingSkeleton />;
  if (!entry) {
    return (
      <div className="w-container text-center py-20 fade-in">
        <div style={{ fontSize: 48, marginBottom: 12 }}>😶</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{t("notFound")}</p>
      </div>
    );
  }

  const mood = DEFAULT_MOODS.find((m) => m.id === entry.moodTypeId);
  const moodColor = mood?.color ?? "#F4F2F7";
  const moodLabel = th ? mood?.labelTh : mood?.label;
  const date = new Date(entry.createdAt);
  const score = MOOD_SCORES[entry.moodTypeId] ?? 5;

  const weekday = date.toLocaleDateString(th ? "th-TH" : "en-US", { weekday: "long" });
  const timeLabel = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const hour = date.getHours();
  const period = hour < 12 ? (th ? "เช้า" : "morning") : hour < 17 ? (th ? "บ่าย" : "afternoon") : (th ? "เย็น" : "evening");

  const dayNum = parseInt(entry.date.slice(8, 10), 10);
  const monthShort = date.toLocaleDateString(th ? "th-TH" : "en-US", { month: "short" });
  const yearNum = parseInt(entry.date.slice(0, 4), 10);

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          ← {th ? "กลับ" : "Back"}
        </button>
        <Link href={`/entry/${id}/edit` as "/"} style={{ fontSize: 14, fontWeight: 700, color: "var(--purple)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          ✏️ {th ? "แก้ไข" : "Edit"}
        </Link>
      </div>

      {/* ── Mood Hero ── */}
      <div style={{
        borderRadius: 22, padding: "28px 24px 24px", marginBottom: 20,
        background: `linear-gradient(145deg, ${moodColor}30 0%, ${moodColor}15 100%)`,
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {mood && (
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: moodColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={40} height={40} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>{moodLabel}</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 4 }}>
              {weekday} · {timeLabel} {th ? "น." : ""} · {period}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 16 }}>
          <span style={{ fontSize: "clamp(48px, 10vw, 72px)", fontWeight: 800, color: "var(--ink)", lineHeight: 0.9, letterSpacing: "-0.03em" }}>{dayNum}</span>
          <span style={{ fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 800, color: "var(--ink-2)", fontStyle: "italic", letterSpacing: "-0.02em" }}>{monthShort}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-3)", marginLeft: 4 }}>{yearNum}</span>
        </div>
        {entry.entryNumber && (
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)", marginTop: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>
            {th ? "บันทึกที่" : "Entry #"} {entry.entryNumber}
          </div>
        )}
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="grid-2col" style={{ alignItems: "start" }}>

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="entry-detail-left" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Note */}
          {entry.note && (
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--hairline)", borderRadius: 18, padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{th ? "บันทึก" : "Note"}</div>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink)", margin: 0 }}>{entry.note}</p>
            </div>
          )}

          {/* Image */}
          {entry.imageUrl && (
            <img src={entry.imageUrl} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 18, background: "var(--surface-2)" }} />
          )}

          {/* AI Insight */}
          {entry.aiSummary && (
            <div style={{
              borderRadius: 18, padding: "18px 20px",
              background: "linear-gradient(135deg, #FAF7FE 0%, #FDE8DA 60%, #FFF4EB 100%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "#A673F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" /></svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#7A4DD0", letterSpacing: 0.3 }}>AI {th ? "สังเกตเห็น" : "INSIGHT"}</span>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink)" }} dangerouslySetInnerHTML={{ __html: (entry.aiSummary ?? "").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
              <div style={{ marginTop: 10 }}>
                <AiDisclaimer variant="analysis" />
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>{th ? "แท็กของบันทึก" : "Entry tags"}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {entry.tags && entry.tags.length > 0 ? (
                entry.tags.map((tag, i) => (
                  <span key={i} style={{ padding: "8px 16px", borderRadius: 100, background: "var(--surface-2)", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                    # {tag}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 14, color: "var(--ink-3)", fontStyle: "italic" }}>{th ? "ไม่มีแท็ก" : "No tags"}</span>
              )}
            </div>
          </div>

          {/* Delete */}
          <div style={{ paddingTop: 8 }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 100,
                color: confirmDelete ? "#fff" : "var(--ink-3)",
                background: confirmDelete ? "#D14343" : "none",
                border: confirmDelete ? "none" : "none",
                padding: confirmDelete ? "8px 20px" : 0,
              }}
            >
              {deleting ? "..." : confirmDelete ? (th ? "ยืนยันลบ" : "Confirm delete") : `× ${th ? "ลบบันทึกนี้" : "Delete this entry"}`}
            </button>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="entry-detail-right" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Nearby days — timeline style */}
          {nearby.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>{th ? "วันใกล้เคียง" : "Nearby days"}</div>
              <div style={{ position: "relative", paddingLeft: 44 }}>
                <div style={{ position: "absolute", left: 17, top: 8, bottom: 8, width: 2, background: "var(--hairline)" }} />
                {nearby.map((n) => {
                  const nm = DEFAULT_MOODS.find((m) => m.id === n.moodTypeId);
                  const nd = new Date(n.date + "T12:00:00");
                  const isCur = n.date === entry.date;
                  return (
                    <div key={n.date} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", position: "relative" }}>
                      <div style={{ position: "absolute", left: -40, top: 12, width: 28, display: "flex", justifyContent: "center" }}>
                        {nm ? (
                          <img src={moodIconUrl(nm.id, pack, iconFormat)} alt="" width={isCur ? 28 : 22} height={isCur ? 28 : 22} style={{ borderRadius: "50%", border: isCur ? "2px solid var(--ink)" : "none" }} />
                        ) : (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--surface-2)", border: "2px solid var(--hairline)" }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: isCur ? 800 : 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                          {nd.toLocaleDateString(th ? "th-TH" : "en-US", { weekday: "short", day: "numeric", month: "short" })}
                          {isCur && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "var(--peach)", padding: "1px 8px", borderRadius: 100 }}>{th ? "บันทึกนี้" : "This"}</span>}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 2 }}>
                          {n.note ? n.note.slice(0, 40) + (n.note.length > 40 ? "..." : "") : (n.moodTypeId ? (th ? nm?.labelTh : nm?.label) : (th ? "ยังไม่มีบันทึก" : "No entry"))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* This day last month */}
          {lastYear && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>{th ? "วันนี้เมื่อเดือนที่แล้ว" : "This day last month"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {(() => { const lm = DEFAULT_MOODS.find((m) => m.id === lastYear.moodTypeId); return lm ? <img src={moodIconUrl(lm.id, pack, iconFormat)} alt="" width={32} height={32} /> : null; })()}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                    {new Date(lastYear.date + "T12:00:00").toLocaleDateString(th ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{th ? DEFAULT_MOODS.find((m) => m.id === lastYear.moodTypeId)?.labelTh : DEFAULT_MOODS.find((m) => m.id === lastYear.moodTypeId)?.label}
                  </div>
                  {lastYear.note && (
                    <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 2 }}>
                      &ldquo;{lastYear.note.slice(0, 50)}{lastYear.note.length > 50 ? "..." : ""}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Streak */}
          {streak > 1 && (
            <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FDE8DA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔥</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                  {th ? `วันที่ ${streak} ของสตรีค` : `Day ${streak} of your streak`}
                </div>
                <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
                  {th ? "บันทึกครบทุกวันติดต่อกัน" : "Logged every day in a row"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-container pt-16 fade-in">
      <div className="grid-2col">
        <div className="space-y-4">
          <div style={{ height: 80, width: "60%", borderRadius: 12, background: "var(--surface-2)", opacity: 0.6 }} />
          <div style={{ height: 40, width: "40%", borderRadius: 100, background: "var(--surface-2)", opacity: 0.5 }} />
          <div style={{ height: 80, borderRadius: 16, background: "var(--surface-2)", opacity: 0.4 }} />
        </div>
        <div className="space-y-4">
          <div style={{ height: 200, borderRadius: 22, background: "var(--surface-2)", opacity: 0.5 }} />
          <div style={{ height: 120, borderRadius: 14, background: "var(--surface-2)", opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}
