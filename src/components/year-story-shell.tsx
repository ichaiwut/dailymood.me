"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { AiDisclaimer } from "./ai-disclaimer";
import { PASticker } from "./paper/pa-sticker";
import { PAClip } from "./paper/pa-clip";
import { PAMark } from "./paper/pa-mark";

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

const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--w-ink-3)", marginBottom: 12 };

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
    <div className="pa-wrap" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="pa-sheet" style={{ maxWidth: 460, borderRadius: 18, padding: "40px 32px", position: "relative", textAlign: "center" }}>
        <span className="pa-washi lav" aria-hidden style={{ width: 110, top: -12 }} />
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--purple-strong)", marginBottom: 14 }}>Year Story</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--w-ink)", marginBottom: 12, lineHeight: 1.15 }}>
          {th ? "ค้นพบเรื่องราวอารมณ์ตลอดทั้งปี" : "Discover your emotional year"}
        </h1>
        <p style={{ fontSize: 16, color: "var(--w-ink-2)", lineHeight: 1.6, marginBottom: 24 }}>
          {th ? "ดู insight, pattern, และสรุปจาก AI ที่เป็นเอกลักษณ์ของคุณ" : "See insights, patterns, and a unique AI summary of your year"}
        </p>
        <Link href={"/pricing" as "/"} className="pa-btn purple" style={{ textDecoration: "none", height: 46, padding: "0 28px" }}>
          {th ? "ดู Pro" : "View Pro"}
        </Link>
      </div>
    </div>
  );

  if (loading || !data) return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
    return data.dayMap[key] ? moodColor(data.dayMap[key]) : "var(--w-tint)";
  });

  return (
    <div className="pa-wrap fade-in" style={{ paddingBottom: 60 }}>
      <style>{`
        .ys-reveal{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
        .ys-reveal.visible{opacity:1;transform:none}
        .ys-w{max-width:960px;margin:0 auto;padding:16px 24px 0}
        @media(max-width:767px){
          .ys-w{padding:12px 16px 0}
          .ys-2col{grid-template-columns:1fr!important}
          .ys-strip span{width:10px!important;height:16px!important}
        }
      `}</style>

      <div className="ys-w">
        {/* ═══ HERO folder ═══ */}
        <Reveal>
          <div style={{ position: "relative", marginBottom: 30 }}>
            <span className="pa-tab purple">★ YEAR STORY</span>
            <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "clamp(24px, 4vw, 40px)", position: "relative" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: -60, right: -50, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, var(--lavender), transparent 70%)", opacity: 0.4 }} />
              </div>
              <PAClip style={{ top: -15, right: 44, transform: "rotate(7deg)", zIndex: 8 }} />
              <div style={{ position: "relative" }}>
                <Link href={"/year-in-pixels" as "/"} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 700, color: "var(--w-ink-3)", textDecoration: "none", marginBottom: 8 }}>
                  ← Year in Pixels
                </Link>
                <h1 style={{ fontSize: "clamp(72px, 15vw, 148px)", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-.05em", color: "var(--w-ink)", margin: "6px 0 0" }}>
                  {year}
                </h1>
                {ai?.yearTheme && (
                  <p style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700, color: "var(--w-ink-2)", marginTop: 18, maxWidth: 560 }}>
                    <PAMark color="var(--yellow)">{ai.yearTheme}</PAMark>
                  </p>
                )}
                <div className="ys-strip" style={{ display: "flex", gap: 3, marginTop: 28, overflow: "hidden" }}>
                  {pixelStrip.map((c, i) => (
                    <span key={i} style={{ width: 14, height: 22, borderRadius: 3, background: c, flexShrink: 0 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ═══ KEY STATS — two folders ═══ */}
        <Reveal>
          <div className="ys-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 30 }}>
            <div className="pa-sheet" style={{ borderRadius: 16, padding: "22px 24px 20px", position: "relative" }}>
              <span className="pa-washi" aria-hidden style={{ width: 88 }} />
              <div style={{ fontSize: "clamp(52px, 9vw, 80px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-.03em", color: "var(--w-ink)", marginTop: 6 }}>{data.totalDays}</div>
              <div style={{ ...eyebrow, marginTop: 10, marginBottom: 4 }}>{th ? "วันที่บันทึก" : "Days logged"}</div>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)" }}>{th ? `จาก ${data.daysInYear} วัน · ${pct}%` : `of ${data.daysInYear} · ${pct}%`}</div>
            </div>
            <div className="pa-sheet" style={{ borderRadius: 16, padding: "22px 24px 20px", position: "relative" }}>
              <span className="pa-washi yellow" aria-hidden style={{ width: 88 }} />
              <div style={{ fontSize: "clamp(52px, 9vw, 80px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-.03em", color: "var(--w-ink)", marginTop: 6 }}>{data.streak.days} <span style={{ fontSize: 28 }}>🔥</span></div>
              <div style={{ ...eyebrow, marginTop: 10, marginBottom: 4 }}>{th ? "วันติดต่อกัน" : "Day streak"}</div>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)" }}>{th ? "สถิติสูงสุด" : "personal best"}{data.streak.month > 0 ? ` · ${mf[data.streak.month - 1]}` : ""}</div>
            </div>
          </div>
        </Reveal>

        {/* ═══ DOMINANT MOOD folder ═══ */}
        {mood && (
          <Reveal>
            <div style={{ position: "relative", marginBottom: 30 }}>
              <span className="pa-tab lav">{th ? "อารมณ์ที่ครองปีนี้" : "Dominant mood"}</span>
              <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "26px 28px", position: "relative", overflow: "hidden" }}>
                <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" }}>
                  <div style={{ position: "absolute", top: -50, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${moodColor(data.dominantMood)}, transparent 70%)`, opacity: 0.35 }} />
                </div>
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
                    <PASticker moodId={mood.id} color={mood.color} size={64} pack={pack} iconFormat={iconFormat} style={{ transform: "rotate(-6deg)" }} />
                    <div>
                      <div style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--w-ink)" }}>
                        {moodLabel(data.dominantMood, locale) ?? "—"}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: moodColor(data.dominantMood), marginTop: 2 }}>{data.dominantPct}%</div>
                    </div>
                  </div>
                  {moodDist.length > 0 && (
                    <>
                      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 14 }}>
                        {moodDist.map((m) => (<div key={m.id} style={{ width: `${m.pct}%`, background: m.color, minWidth: m.pct > 0 ? 4 : 0 }} />))}
                      </div>
                      <div style={{ display: "flex", gap: "clamp(12px, 2vw, 22px)", flexWrap: "wrap" }}>
                        {moodDist.slice(0, 5).map((m) => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink-2)" }}>{th ? m.labelTh : m.label} {m.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* ═══ BEST + HARD MONTH folders ═══ */}
        <div className="ys-2col" style={{ display: "grid", gridTemplateColumns: data.bestMonth && data.hardMonth ? "1fr 1fr" : "1fr", gap: 18, marginBottom: 30 }}>
          {data.bestMonth && (
            <Reveal>
              <div style={{ position: "relative", height: "100%" }}>
                <span className="pa-tab yellow">{th ? "เดือนที่ดีที่สุด" : "Best month"}</span>
                <div className="pa-sheet" style={{ borderRadius: "4px 16px 16px 16px", padding: "22px 24px", height: "calc(100% - 8px)" }}>
                  <div style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--w-ink)", marginBottom: 4 }}>{mf[data.bestMonth.month - 1]}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#E8923E", marginBottom: ai?.bestQuarter ? 14 : 0 }}>{data.bestMonth.avg} / 5</div>
                  {ai?.bestQuarter && <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--w-ink-2)", margin: 0 }}>{ai.bestQuarter}</p>}
                </div>
              </div>
            </Reveal>
          )}
          {data.hardMonth && (
            <Reveal>
              <div style={{ position: "relative", height: "100%" }}>
                <span className="pa-tab purple">{th ? "เดือนที่ท้าทาย" : "Toughest month"}</span>
                <div className="pa-sheet" style={{ borderRadius: "4px 16px 16px 16px", padding: "22px 24px", height: "calc(100% - 8px)" }}>
                  <div style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--w-ink)", marginBottom: 4 }}>{mf[data.hardMonth.month - 1]}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--purple-strong)", marginBottom: ai?.hardestPeriod ? 14 : 0 }}>{data.hardMonth.avg} / 5</div>
                  {ai?.hardestPeriod && <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--w-ink-2)", margin: 0 }}>{ai.hardestPeriod}</p>}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* ═══ PATTERNS — two folders ═══ */}
        <Reveal>
          <div className="ys-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 30 }}>
            {data.topTrigger && (
              <div className="pa-sheet" style={{ borderRadius: 16, padding: "20px 22px" }}>
                <div style={eyebrow}>{th ? "สิ่งที่ส่งผลมากสุด" : "Top influence"}</div>
                <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, color: "var(--w-ink)", marginBottom: 4 }}>&ldquo;{data.topTrigger.tag}&rdquo;</div>
                <div style={{ fontSize: 14, color: "var(--w-ink-3)" }}>{data.topTrigger.count} {th ? "ครั้งตลอดปี" : "times this year"}</div>
              </div>
            )}
            <div className="pa-sheet" style={{ borderRadius: 16, padding: "20px 22px" }}>
              <div style={eyebrow}>{th ? "ช่วงท้ายปี" : "End of year"}</div>
              <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, color: "var(--w-ink)", marginBottom: 4 }}>
                {data.trendQ4.pct > 0 ? (th ? "ดีขึ้นเรื่อย ๆ" : "Improving") : data.trendQ4.pct < 0 ? (th ? "ท้าทาย" : "Challenging") : (th ? "คงที่" : "Steady")}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: data.trendQ4.pct >= 0 ? "#1A8A4A" : "#C53030" }}>
                {data.trendQ4.pct >= 0 ? "+" : ""}{data.trendQ4.pct}%
              </div>
            </div>
          </div>
        </Reveal>

        {/* ═══ AI NARRATIVE — plum folder ═══ */}
        {ai && (
          <Reveal>
            <div style={{ position: "relative", marginBottom: 30 }}>
              <span className="pa-tab ink">✦ AI · {th ? "สรุปปีของคุณ" : "Year Summary"}</span>
              <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", background: "linear-gradient(155deg,#2A1F33,#1A1320)", color: "#fff", padding: "clamp(28px, 5vw, 48px)", position: "relative", overflow: "hidden" }}>
                <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, var(--peach), transparent 70%)", opacity: 0.3 }} />
                <div
                  style={{ position: "relative", fontSize: "clamp(19px, 2.6vw, 26px)", lineHeight: 1.7, color: "rgba(255,255,255,.6)", fontWeight: 600 }}
                  dangerouslySetInnerHTML={{ __html: ai.summary.replace(/\*\*(.*?)\*\*/g, "<b style='color:rgba(255,255,255,.92);font-weight:800'>$1</b>") }}
                />
                <div style={{ position: "relative", marginTop: 24 }}>
                  <AiDisclaimer variant="story" style={{ color: "rgba(255,255,255,.4)" }} />
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* ═══ PIXEL GRID folder ═══ */}
        <Reveal>
          <div style={{ position: "relative", marginBottom: 30 }}>
            <span className="pa-tab mint">{th ? "ทุกวันของปี" : "Every day of the year"}</span>
            <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "clamp(16px, 3vw, 28px)", overflowX: "auto" }}>
              <div style={{ minWidth: 580, display: "grid", gridTemplateColumns: "40px repeat(31, 1fr)", gap: 2 }}>
                {Array.from({ length: 12 }, (_, mi) => {
                  const m = mi + 1;
                  const d = daysInMonth(year, m);
                  return [
                    <div key={`l${mi}`} style={{ fontSize: 14, fontWeight: 800, color: "var(--w-ink-3)", display: "flex", alignItems: "center" }}>{MTH[mi]}</div>,
                    ...Array.from({ length: 31 }, (_, di) => {
                      if (di >= d) return <div key={`e${mi}-${di}`} />;
                      const ds = `${year}-${String(m).padStart(2, "0")}-${String(di + 1).padStart(2, "0")}`;
                      const mid = data.dayMap[ds];
                      return <div key={ds} style={{ aspectRatio: "1", borderRadius: 3, background: mid ? moodColor(mid) : "var(--w-tint)" }} />;
                    }),
                  ];
                })}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--w-rule)" }}>
                {DEFAULT_MOODS.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                    <span style={{ fontSize: 14, color: "var(--w-ink-3)", fontWeight: 600 }}>{th ? m.labelTh : m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ═══ OUTRO ═══ */}
        <Reveal>
          <div className="pa-sheet" style={{ borderRadius: 18, padding: "clamp(36px, 6vw, 56px) 28px", textAlign: "center", position: "relative", marginBottom: 8 }}>
            <PASticker moodId="amazing" color="var(--peach)" size={52} pack={pack} iconFormat={iconFormat} style={{ margin: "0 auto 18px", transform: "rotate(-8deg)" }} />
            <p style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, color: "var(--w-ink)", lineHeight: 1.2, maxWidth: 480, margin: "0 auto 12px" }}>
              {th ? `ขอบคุณสำหรับปี ${year}` : `Thank you for ${year}`}
            </p>
            <p style={{ fontSize: 16, color: "var(--w-ink-3)", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>
              {th ? "ทุกอารมณ์ที่คุณบันทึกคือก้าวหนึ่งของการเข้าใจตัวเอง" : "Every mood you logged is a step toward understanding yourself"}
            </p>
            <Link href={"/year-in-pixels" as "/"} className="pa-btn" style={{ height: 44, padding: "0 24px", textDecoration: "none" }}>
              ← {th ? "กลับ Year in Pixels" : "Back to Pixels"}
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
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
