"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK, moodIconUrl } from "@/lib/moods";

type Tier = "guest" | "free" | "premium";

interface YearData {
  year: number;
  dayMap: Record<string, string>;
  totalDays: number;
  daysInYear: number;
  bestMonth: { month: number; avg: number } | null;
  hardMonth: { month: number; avg: number } | null;
  dominantMood: string;
  dominantPct: number;
  trendQ4: { pct: number };
  topTrigger: { tag: string; count: number } | null;
  streak: { days: number; month: number };
  aiSummary: {
    summary: string;
    summaryShort: string;
    bestQuarter: string;
    hardestPeriod: string;
    yearTheme: string;
  } | null;
}

const MTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MFULL_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MFULL_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function moodLabel(id: string, l: string): string | null {
  if (!id) return null;
  const m = DEFAULT_MOODS.find((d) => d.id === id);
  if (!m) return null;
  return l === "th" ? m.labelTh : m.label;
}
function moodColor(id: string) { return DEFAULT_MOODS.find((m) => m.id === id)?.color ?? "#F4EEE6"; }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

interface Props { tier: Tier; pack?: string; iconFormat?: string; }

export function YearStoryShell({ tier, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: Props) {
  const locale = useLocale();
  const sp = useSearchParams();
  const th = locale === "th";
  const mf = th ? MFULL_TH : MFULL_EN;
  const year = parseInt(sp.get("year") ?? String(new Date().getFullYear()), 10);

  const [data, setData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(true);
  const ok = tier === "premium";

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch(`/api/year-in-pixels?year=${year}&locale=${locale}`); if (r.ok) setData(await r.json() as YearData); } catch {}
    setLoading(false);
  }, [year, locale]);

  useEffect(() => { if (ok) load(); else setLoading(false); }, [ok, load]);

  if (!ok) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 400, padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--purple)", marginBottom: 16 }}>Year Story</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", marginBottom: 12, lineHeight: 1.1 }}>
          {th ? "ค้นพบเรื่องราวอารมณ์ตลอดทั้งปี" : "Discover your emotional year"}
        </h1>
        <p style={{ fontSize: 16, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 28 }}>
          {th ? "ดู insight, pattern, และสรุปจาก AI ที่เป็นเอกลักษณ์ของคุณ" : "See insights, patterns, and a unique AI summary of your year"}
        </p>
        <Link href={"/pricing" as "/"} className="w-btn w-btn-primary" style={{ textDecoration: "none", fontSize: 15, padding: "12px 28px", height: "auto" }}>
          {th ? "ดู Premium" : "View Premium"}
        </Link>
      </div>
    </div>
  );

  if (loading || !data) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="ai-spin" style={{ width: 40, height: 40, margin: "0 auto 16px", borderRadius: "50%", border: "3px solid var(--hairline)", borderTopColor: "var(--purple)" }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-3)" }}>{th ? "กำลังเตรียมเรื่องราว..." : "Preparing your story..."}</p>
      </div>
    </div>
  );

  const ai = data.aiSummary;
  const mood = DEFAULT_MOODS.find((m) => m.id === data.dominantMood);
  const pct = Math.round((data.totalDays / data.daysInYear) * 100);

  const moodCounts: Record<string, number> = {};
  Object.values(data.dayMap).forEach((id) => { moodCounts[id] = (moodCounts[id] || 0) + 1; });
  const moodDist = DEFAULT_MOODS
    .map((m) => ({ ...m, count: moodCounts[m.id] || 0, pct: data.totalDays > 0 ? Math.round(((moodCounts[m.id] || 0) / data.totalDays) * 100) : 0 }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const pixelStrip = Array.from({ length: 52 }, (_, w) => {
    const d = new Date(year, 0, 1 + w * 7);
    const key = d.toISOString().slice(0, 10);
    return data.dayMap[key] ? moodColor(data.dayMap[key]) : "var(--surface-2)";
  });

  return (
    <>
      <style>{`
        .ys-reveal{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
        .ys-reveal.visible{opacity:1;transform:none}
        .ys-w{max-width:960px;margin:0 auto;padding:0 24px}
        @media(max-width:767px){.ys-2col{grid-template-columns:1fr!important}}
      `}</style>

      {/* ═══ HERO ═══ */}
      <div className="ys-w">
        <Reveal>
          <section style={{ paddingTop: "clamp(100px, 18vh, 180px)", paddingBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--purple)", marginBottom: 20 }}>
              Year Story
            </div>
            <h1 style={{ fontSize: "clamp(100px, 22vw, 200px)", fontWeight: 800, lineHeight: .82, letterSpacing: "-.05em", color: "var(--ink)", margin: 0 }}>
              {year}
            </h1>
            {ai?.yearTheme && (
              <p style={{ fontSize: "clamp(18px, 3vw, 28px)", fontWeight: 600, color: "var(--ink-3)", fontStyle: "italic", marginTop: 20, maxWidth: 560 }}>
                {ai.yearTheme}
              </p>
            )}
            <div style={{ display: "flex", gap: 3, marginTop: 40, overflow: "hidden" }}>
              {pixelStrip.map((c, i) => (
                <span key={i} style={{ width: 14, height: 20, borderRadius: 3, background: c, flexShrink: 0 }} />
              ))}
            </div>
          </section>
        </Reveal>

        {/* ═══ KEY STATS ═══ */}
        <Reveal>
          <section style={{ paddingBottom: "clamp(60px, 10vh, 100px)" }}>
            <div style={{ height: 1, background: "var(--hairline)", marginBottom: "clamp(40px, 6vh, 60px)" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(24px, 4vw, 48px)" }} className="ys-2col">
              <div>
                <div style={{ fontSize: "clamp(64px, 12vw, 96px)", fontWeight: 800, lineHeight: .9, letterSpacing: "-.03em", color: "var(--ink)" }}>
                  {data.totalDays}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginTop: 8, textTransform: "uppercase", letterSpacing: .5 }}>
                  {th ? "วันที่บันทึก" : "Days logged"}
                </div>
                <div style={{ fontSize: 15, color: "var(--ink-3)", marginTop: 4 }}>
                  {th ? `จาก ${data.daysInYear} วัน · ${pct}%` : `of ${data.daysInYear} · ${pct}%`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "clamp(64px, 12vw, 96px)", fontWeight: 800, lineHeight: .9, letterSpacing: "-.03em", color: "var(--ink)" }}>
                  {data.streak.days}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginTop: 8, textTransform: "uppercase", letterSpacing: .5 }}>
                  {th ? "วันติดต่อกัน" : "Day streak"}
                </div>
                <div style={{ fontSize: 15, color: "var(--ink-3)", marginTop: 4 }}>
                  {th ? "สถิติสูงสุด" : "personal best"}{data.streak.month > 0 ? ` · ${mf[data.streak.month - 1]}` : ""}
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      {/* ═══ DOMINANT MOOD — tinted full-bleed ═══ */}
      {mood && (
        <div style={{ background: `${moodColor(data.dominantMood)}0C` }}>
          <div className="ys-w">
            <Reveal>
              <section style={{ padding: "clamp(60px, 10vh, 100px) 0" }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 20 }}>
                  {th ? "อารมณ์ที่ครองปีนี้" : "Dominant mood"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 24px)", marginBottom: 36 }}>
                  <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={64} height={64} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "clamp(36px, 7vw, 56px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--ink)" }}>
                      {moodLabel(data.dominantMood, locale) ?? "—"}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: moodColor(data.dominantMood), marginTop: 2 }}>
                      {data.dominantPct}%
                    </div>
                  </div>
                </div>

                {moodDist.length > 0 && (
                  <>
                    <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 14 }}>
                      {moodDist.map((m) => (
                        <div key={m.id} style={{ width: `${m.pct}%`, background: m.color, minWidth: m.pct > 0 ? 4 : 0 }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "clamp(12px, 2vw, 24px)", flexWrap: "wrap" }}>
                      {moodDist.slice(0, 5).map((m) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>
                            {th ? m.labelTh : m.label} {m.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </Reveal>
          </div>
        </div>
      )}

      <div className="ys-w">
        {/* ═══ BEST MONTH ═══ */}
        {data.bestMonth && (
          <Reveal>
            <section style={{ paddingTop: "clamp(40px, 6vh, 72px)", paddingBottom: "clamp(32px, 4vh, 48px)" }}>
              <div style={{ borderLeft: "4px solid #E8923E", paddingLeft: "clamp(20px, 3vw, 32px)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#C77B3F", marginBottom: 12 }}>
                  {th ? "เดือนที่ดีที่สุด" : "Best month"}
                </div>
                <div style={{ fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--ink)", marginBottom: 4 }}>
                  {mf[data.bestMonth.month - 1]}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#E8923E", marginBottom: ai?.bestQuarter ? 16 : 0 }}>
                  {data.bestMonth.avg} / 5
                </div>
                {ai?.bestQuarter && (
                  <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 540, margin: 0 }}>{ai.bestQuarter}</p>
                )}
              </div>
            </section>
          </Reveal>
        )}

        {/* ═══ HARDEST MONTH ═══ */}
        {data.hardMonth && (
          <Reveal>
            <section style={{ paddingBottom: "clamp(40px, 6vh, 72px)" }}>
              <div style={{ borderLeft: "4px solid var(--purple)", paddingLeft: "clamp(20px, 3vw, 32px)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#7A4DD0", marginBottom: 12 }}>
                  {th ? "เดือนที่ท้าทาย" : "Toughest month"}
                </div>
                <div style={{ fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--ink)", marginBottom: 4 }}>
                  {mf[data.hardMonth.month - 1]}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--purple)", marginBottom: ai?.hardestPeriod ? 16 : 0 }}>
                  {data.hardMonth.avg} / 5
                </div>
                {ai?.hardestPeriod && (
                  <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 540, margin: 0 }}>{ai.hardestPeriod}</p>
                )}
              </div>
            </section>
          </Reveal>
        )}

        {/* ═══ PATTERNS ═══ */}
        <Reveal>
          <section style={{ paddingBottom: "clamp(48px, 8vh, 80px)" }}>
            <div style={{ height: 1, background: "var(--hairline)", marginBottom: "clamp(40px, 6vh, 60px)" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(24px, 4vw, 48px)" }} className="ys-2col">
              {data.topTrigger && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>
                    {th ? "สิ่งที่ส่งผลมากสุด" : "Top influence"}
                  </div>
                  <div style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
                    &ldquo;{data.topTrigger.tag}&rdquo;
                  </div>
                  <div style={{ fontSize: 15, color: "var(--ink-3)" }}>
                    {data.topTrigger.count} {th ? "ครั้งตลอดปี" : "times this year"}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>
                  {th ? "ช่วงท้ายปี" : "End of year"}
                </div>
                <div style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
                  {data.trendQ4.pct > 0 ? (th ? "ดีขึ้นเรื่อย ๆ" : "Improving") : data.trendQ4.pct < 0 ? (th ? "ท้าทาย" : "Challenging") : (th ? "คงที่" : "Steady")}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: data.trendQ4.pct >= 0 ? "#1A8A4A" : "#C53030" }}>
                  {data.trendQ4.pct >= 0 ? "+" : ""}{data.trendQ4.pct}%
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      {/* ═══ AI NARRATIVE — dark contrast ═══ */}
      {ai && (
        <div style={{ background: "#1A1320" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(80px, 12vh, 140px) 24px" }}>
            <Reveal>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(166,115,241,.45)", marginBottom: 28, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="rgba(166,115,241,.6)" /></svg>
                AI {th ? "สรุปปีของคุณ" : "Year Summary"}
              </div>
              <div
                style={{ fontSize: "clamp(20px, 3vw, 28px)", lineHeight: 1.7, color: "rgba(255,255,255,.5)", fontWeight: 600 }}
                dangerouslySetInnerHTML={{ __html: ai.summary.replace(/\*\*(.*?)\*\*/g, "<b style='color:rgba(255,255,255,.82);font-weight:800'>$1</b>") }}
              />
            </Reveal>
          </div>
        </div>
      )}

      {/* ═══ PIXEL GRID ═══ */}
      <div className="ys-w">
        <section style={{ padding: "clamp(60px, 10vh, 100px) 0" }}>
          <Reveal>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 20 }}>
              {th ? "ทุกวันของปี" : "Every day of the year"}
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 16, padding: "clamp(16px, 3vw, 28px)", overflowX: "auto" }}>
              <div style={{ minWidth: 580, display: "grid", gridTemplateColumns: "40px repeat(31, 1fr)", gap: 2 }}>
                {Array.from({ length: 12 }, (_, mi) => {
                  const m = mi + 1;
                  const d = daysInMonth(year, m);
                  return [
                    <div key={`l${mi}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", display: "flex", alignItems: "center" }}>{MTH[mi]}</div>,
                    ...Array.from({ length: 31 }, (_, di) => {
                      if (di >= d) return <div key={`e${mi}-${di}`} />;
                      const ds = `${year}-${String(m).padStart(2, "0")}-${String(di + 1).padStart(2, "0")}`;
                      const mid = data.dayMap[ds];
                      return <div key={ds} style={{ aspectRatio: "1", borderRadius: 3, background: mid ? moodColor(mid) : "var(--surface-2)" }} />;
                    }),
                  ];
                })}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--hairline)" }}>
                {DEFAULT_MOODS.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                    <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>{th ? m.labelTh : m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══ OUTRO ═══ */}
        <Reveal>
          <section style={{ paddingBottom: "clamp(80px, 12vh, 140px)", textAlign: "center" }}>
            <p style={{ fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, maxWidth: 480, margin: "0 auto 12px" }}>
              {th ? `ขอบคุณสำหรับปี ${year}` : `Thank you for ${year}`}
            </p>
            <p style={{ fontSize: 16, color: "var(--ink-3)", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.6 }}>
              {th ? "ทุกอารมณ์ที่คุณบันทึกคือก้าวหนึ่งของการเข้าใจตัวเอง" : "Every mood you logged is a step toward understanding yourself"}
            </p>
            <Link
              href={"/year-in-pixels" as "/"}
              style={{ fontSize: 15, fontWeight: 700, color: "var(--purple)", textDecoration: "none" }}
            >
              ← {th ? "กลับ Year in Pixels" : "Back to Pixels"}
            </Link>
          </section>
        </Reveal>
      </div>
    </>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`ys-reveal${vis ? " visible" : ""}`}>{children}</div>;
}
