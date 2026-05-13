"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";

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
    <div className="w-container fade-in" style={{ paddingTop: 20, paddingBottom: 60 }}>
      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          ← {th ? "ไทม์ไลน์" : "Timeline"}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/entry/${id}/edit` as "/"} className="w-btn" style={{ background: "var(--ink)", color: "#fff", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            ✏️ {th ? "แก้ไข" : "Edit"}
          </Link>
        </div>
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="grid-2col" style={{ alignItems: "start" }}>

        {/* ═══ LEFT COLUMN ═══ */}
        <div>
          {/* Date hero */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 15, color: "var(--ink-3)", marginBottom: 8 }}>
              {weekday} · {timeLabel} {th ? "น." : ""} · {period}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: "clamp(72px, 12vw, 100px)", fontWeight: 800, color: "var(--ink)", lineHeight: 0.9, letterSpacing: "-0.03em" }}>{dayNum}</span>
              <span style={{ fontSize: "clamp(48px, 8vw, 68px)", fontWeight: 800, color: "var(--ink-2)", fontStyle: "italic", letterSpacing: "-0.02em" }}>{monthShort}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-2)", marginTop: 8 }}>
              {yearNum}{entry.entryNumber ? ` · ${th ? "บันทึกที่" : "Entry #"} ${entry.entryNumber}` : ""}
            </div>
          </div>

          {/* Mood pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 20px 10px 10px", borderRadius: 100, background: "#fff", border: `2px solid ${moodColor}`, marginBottom: 24 }}>
            {mood && (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: moodColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={26} height={26} />
              </div>
            )}
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{th ? "อารมณ์" : "Mood"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{moodLabel}</div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--hairline)", marginBottom: 24 }} />

          {/* Note */}
          {entry.note && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>{th ? "บันทึก" : "Note"}</div>
                <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink)", margin: 0 }}>{entry.note}</p>
              </div>
              <div style={{ height: 1, background: "var(--hairline)", marginBottom: 24 }} />
            </>
          )}

          {/* Image */}
          {entry.imageUrl && (
            <>
              <div style={{ marginBottom: 24 }}>
                <img src={entry.imageUrl} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 16, background: "var(--surface-2)" }} />
              </div>
              <div style={{ height: 1, background: "var(--hairline)", marginBottom: 24 }} />
            </>
          )}

          {/* AI Insight */}
          {entry.aiSummary && (
            <>
              <div style={{ marginBottom: 24, borderLeft: "3px solid var(--purple)", paddingLeft: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="var(--purple)" /></svg>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--purple)" }}>AI {th ? "สังเกตเห็น" : "Insight"}</span>
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink)" }} dangerouslySetInnerHTML={{ __html: (entry.aiSummary ?? "").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
              </div>
              <div style={{ height: 1, background: "var(--hairline)", marginBottom: 24 }} />
            </>
          )}

          {/* Tags */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>{th ? "แท็กของบันทึก" : "Entry tags"}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {entry.tags && entry.tags.length > 0 ? (
                entry.tags.map((tag, i) => (
                  <span key={i} style={{ padding: "8px 16px", borderRadius: 100, border: "1.5px solid var(--hairline)", background: "#fff", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                    #{tag}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 14, color: "var(--ink-3)", fontStyle: "italic" }}>{th ? "ไม่มีแท็ก" : "No tags"}</span>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--hairline)", marginBottom: 24 }} />

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ fontSize: 14, fontWeight: 700, color: confirmDelete ? "#fff" : "#D14343", background: confirmDelete ? "#D14343" : "none", border: confirmDelete ? "none" : "none", cursor: "pointer", padding: confirmDelete ? "8px 20px" : 0, borderRadius: 100 }}
          >
            {deleting ? "..." : confirmDelete ? (th ? "ยืนยันลบ" : "Confirm delete") : `× ${th ? "ลบบันทึกนี้" : "Delete this entry"}`}
          </button>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Mood hero card */}
          <div style={{
            borderRadius: 22,
            padding: "32px 24px 24px",
            background: moodColor,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 12, left: 14, fontSize: 14, fontWeight: 700, color: "rgba(0,0,0,.3)" }}>{weekday}</div>
            {mood && <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={80} height={80} style={{ margin: "0 auto 12px", display: "block" }} />}
            <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(0,0,0,.5)" }}>{moodLabel}</div>
          </div>

          {/* Nearby days — timeline style */}
          {nearby.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 14 }}>{th ? "วันใกล้เคียง" : "Nearby days"}</div>
              <div style={{ position: "relative", paddingLeft: 44 }}>
                {/* Vertical line */}
                <div style={{ position: "absolute", left: 17, top: 8, bottom: 8, width: 2, background: "var(--hairline)" }} />
                {nearby.map((n, idx) => {
                  const nm = DEFAULT_MOODS.find((m) => m.id === n.moodTypeId);
                  const nd = new Date(n.date + "T12:00:00");
                  const isCur = n.date === entry.date;
                  return (
                    <div key={n.date} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", position: "relative" }}>
                      {/* Dot on timeline */}
                      <div style={{ position: "absolute", left: -40, top: 12, width: 28, display: "flex", justifyContent: "center" }}>
                        {nm ? (
                          <img src={moodIconUrl(nm.id, pack, iconFormat)} alt="" width={isCur ? 28 : 22} height={isCur ? 28 : 22} style={{ borderRadius: "50%", border: isCur ? "2px solid var(--ink)" : "none" }} />
                        ) : (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--surface-2)", border: "2px solid var(--hairline)" }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: isCur ? 800 : 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 10 }}>
                          {nd.toLocaleDateString(th ? "th-TH" : "en-US", { weekday: "short" })} {nd.toLocaleDateString(th ? "th-TH" : "en-US", { day: "numeric", month: "short" })}
                          {isCur && (
                            <>
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: "var(--ink)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} /></span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--peach)" }}>{n.date === new Date().toISOString().slice(0, 10) ? (th ? "วันนี้" : "Today") : (th ? "วันนี้" : "This entry")}</span>
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 2 }}>
                          {n.note ? n.note.slice(0, 30) + (n.note.length > 30 ? "..." : "") : (n.moodTypeId ? (th ? nm?.labelTh : nm?.label) : (th ? "ยังไม่มีบันทึก" : "No entry"))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* This day last year */}
          {lastYear && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>{th ? "วันนี้เมื่อเดือนที่แล้ว" : "This day last month"}</div>
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
