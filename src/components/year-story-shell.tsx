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

function moodLabel(id: string, l: string) { const m = DEFAULT_MOODS.find((d) => d.id === id); return l === "th" ? m?.labelTh : m?.label; }
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

  // Premium gate
  if (!ok) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>📖</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "var(--ink)", marginBottom: 12 }}>Year Story</h1>
        <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 32 }}>
          {th ? "ค้นพบเรื่องราวอารมณ์ตลอดทั้งปีของคุณ" : "Discover the emotional story of your year"}
        </p>
        <Link href={"/pricing" as "/"} className="w-btn w-btn-primary" style={{ textDecoration: "none", fontSize: 16, padding: "14px 32px", height: "auto" }}>
          {th ? "อัพเป็น Premium" : "Upgrade to Premium"}
        </Link>
      </div>
    </div>
  );

  // Loading
  if (loading || !data) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="ai-spin" style={{ width: 48, height: 48, margin: "0 auto 20px", borderRadius: "50%", border: "3px solid var(--hairline)", borderTopColor: "var(--purple)" }} />
        <p style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-2)" }}>{th ? "กำลังเตรียมเรื่องราว..." : "Preparing your story..."}</p>
      </div>
    </div>
  );

  const ai = data.aiSummary;
  const mood = DEFAULT_MOODS.find((m) => m.id === data.dominantMood);
  const pct = Math.round((data.totalDays / data.daysInYear) * 100);

  // Build a mini pixel strip for decoration
  const pixelStrip = Array.from({ length: 52 }, (_, w) => {
    const d = new Date(year, 0, 1 + w * 7);
    const key = d.toISOString().slice(0, 10);
    return data.dayMap[key] ? moodColor(data.dayMap[key]) : "var(--surface-2)";
  });

  return (
    <>
      <style>{`
        .ys-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        .ys-reveal.visible { opacity: 1; transform: none; }
        .ys-reveal.d1 { transition-delay: 0.1s; }
        .ys-reveal.d2 { transition-delay: 0.2s; }
        .ys-reveal.d3 { transition-delay: 0.3s; }
        .ys-reveal.d4 { transition-delay: 0.4s; }
        .ys-num { font-size: clamp(72px, 15vw, 140px); font-weight: 800; line-height: 0.9; letter-spacing: -0.04em; }
        .ys-label { font-size: 15px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .ys-big { font-size: clamp(32px, 6vw, 56px); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
        .ys-body { font-size: 17px; line-height: 1.7; max-width: 540px; }
        .ys-strip { display: flex; gap: 3px; overflow: hidden; }
        .ys-strip span { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        @media (max-width: 767px) {
          .ys-2col { grid-template-columns: 1fr !important; }
          .ys-num { font-size: clamp(56px, 12vw, 90px); }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>

        {/* ═══ HERO ═══ */}
        <Reveal>
          <section style={{ paddingTop: "clamp(80px, 15vh, 160px)", paddingBottom: 80 }}>
            <div className="ys-label" style={{ color: "var(--purple)", marginBottom: 16 }}>
              YEAR STORY · {year}
            </div>
            <h1 className="ys-num" style={{ color: "var(--ink)", marginBottom: 20 }}>
              {year}
            </h1>
            {ai?.yearTheme && (
              <p style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "var(--ink-2)", fontStyle: "italic", marginBottom: 16 }}>
                {ai.yearTheme}
              </p>
            )}
            {/* Pixel strip decoration */}
            <div className="ys-strip" style={{ marginTop: 32 }}>
              {pixelStrip.map((c, i) => <span key={i} style={{ background: c }} />)}
            </div>
          </section>
        </Reveal>

        {/* ═══ OVERVIEW — asymmetric 2-col ═══ */}
        <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "clamp(24px, 4vw, 60px)", paddingBottom: 80, alignItems: "end" }} className="ys-2col">
          <Reveal>
            <div>
              <div className="ys-label" style={{ color: "var(--ink-3)", marginBottom: 12 }}>
                {th ? "อารมณ์ที่ครองปีนี้" : "Your year was mostly"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                {mood && (
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: moodColor(data.dominantMood) + "33", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={moodIconUrl(mood.id, pack, iconFormat)} alt="" width={44} height={44} />
                  </div>
                )}
                <div>
                  <div className="ys-big" style={{ color: "var(--ink)" }}>{moodLabel(data.dominantMood, locale)}</div>
                  <div style={{ fontSize: 18, color: moodColor(data.dominantMood), fontWeight: 800, marginTop: 2 }}>{data.dominantPct}%</div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { n: String(data.totalDays), l: th ? `จาก ${data.daysInYear} วัน (${pct}%)` : `of ${data.daysInYear} days (${pct}%)`, c: "var(--peach)" },
                { n: String(data.streak.days), l: th ? `วันติดต่อกัน · ${data.streak.month > 0 ? MTH[data.streak.month - 1] : ""}` : `day streak${data.streak.month > 0 ? ` · ${MTH[data.streak.month - 1]}` : ""}`, c: "var(--purple)" },
              ].map((s, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${s.c}`, paddingLeft: 16 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 15, color: "var(--ink-3)", marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ═══ BEST MONTH ═══ */}
        {data.bestMonth && (
          <Reveal>
            <section style={{
              padding: "clamp(40px, 6vw, 64px)",
              borderRadius: 28,
              background: "linear-gradient(135deg, #FFF8F2 0%, #FDE8DA 50%, #FAD4B8 100%)",
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -20, fontSize: 180, opacity: 0.08, lineHeight: 1, pointerEvents: "none" }}>🏆</div>
              <div className="ys-label" style={{ color: "#C77B3F", marginBottom: 12 }}>
                {th ? "เดือนที่ดีที่สุด" : "Best month"}
              </div>
              <div className="ys-big" style={{ color: "var(--ink)", marginBottom: 8 }}>
                {mf[data.bestMonth.month - 1]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#E8923E" }}>{data.bestMonth.avg} / 5</div>
              {ai?.bestQuarter && (
                <p className="ys-body" style={{ color: "var(--ink-2)", marginTop: 20 }}>{ai.bestQuarter}</p>
              )}
            </section>
          </Reveal>
        )}

        {/* ═══ HARDEST MONTH ═══ */}
        {data.hardMonth && (
          <Reveal>
            <section style={{
              padding: "clamp(40px, 6vw, 64px)",
              borderRadius: 28,
              background: "linear-gradient(135deg, #FAF5FE 0%, #EDE0F7 50%, #DBC8EE 100%)",
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -20, fontSize: 180, opacity: 0.08, lineHeight: 1, pointerEvents: "none" }}>💪</div>
              <div className="ys-label" style={{ color: "#7A4DD0", marginBottom: 12 }}>
                {th ? "เดือนที่ท้าทาย" : "Toughest month"}
              </div>
              <div className="ys-big" style={{ color: "var(--ink)", marginBottom: 8 }}>
                {mf[data.hardMonth.month - 1]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--purple)" }}>{data.hardMonth.avg} / 5</div>
              {ai?.hardestPeriod && (
                <p className="ys-body" style={{ color: "var(--ink-2)", marginTop: 20 }}>{ai.hardestPeriod}</p>
              )}
            </section>
          </Reveal>
        )}

        {/* ═══ TRIGGER + TREND — side by side ═══ */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }} className="ys-2col">
          {data.topTrigger && (
            <Reveal>
              <div style={{ padding: "clamp(32px, 4vw, 48px)", borderRadius: 28, background: "var(--surface)", border: "1.5px solid var(--hairline)", height: "100%" }}>
                <div className="ys-label" style={{ color: "var(--ink-3)", marginBottom: 16 }}>
                  {th ? "Trigger เด่น" : "Top trigger"}
                </div>
                <div style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
                  &ldquo;{data.topTrigger.tag}&rdquo;
                </div>
                <div style={{ fontSize: 16, color: "var(--ink-3)" }}>
                  {data.topTrigger.count}× {th ? "ตลอดปี" : "this year"}
                </div>
              </div>
            </Reveal>
          )}
          <Reveal>
            <div style={{
              padding: "clamp(32px, 4vw, 48px)",
              borderRadius: 28,
              background: data.trendQ4.pct >= 0
                ? "linear-gradient(135deg, #F0FDF4 0%, #D1F0E0 100%)"
                : "linear-gradient(135deg, #FFF5F5 0%, #FDE0E0 100%)",
              height: "100%",
            }}>
              <div className="ys-label" style={{ color: "var(--ink-3)", marginBottom: 16 }}>
                {th ? "ช่วงท้ายปี" : "End of year"}
              </div>
              <div style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
                {data.trendQ4.pct > 0 ? (th ? "ดีขึ้นเรื่อย ๆ" : "Improving") : data.trendQ4.pct < 0 ? (th ? "ท้าทาย" : "Challenging") : (th ? "คงที่" : "Steady")}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: data.trendQ4.pct >= 0 ? "#1A8A4A" : "#C53030" }}>
                {data.trendQ4.pct >= 0 ? "+" : ""}{data.trendQ4.pct}%
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══ AI NARRATIVE ═══ */}
        {ai && (
          <Reveal>
            <section style={{
              padding: "clamp(48px, 7vw, 80px) clamp(32px, 5vw, 64px)",
              borderRadius: 28,
              background: "linear-gradient(145deg, #1A1320 0%, #2D1F3D 40%, #1A1320 100%)",
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Decorative gradient orb */}
              <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(166,115,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(252,164,91,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div className="ys-label" style={{ color: "#A673F1", marginBottom: 24, position: "relative" }}>
                AI {th ? "สรุปปีของคุณ" : "Year Summary"}
              </div>
              <div
                style={{ fontSize: "clamp(18px, 2.5vw, 24px)", lineHeight: 1.7, color: "#C4BCCE", fontWeight: 600, position: "relative" }}
                dangerouslySetInnerHTML={{ __html: ai.summary.replace(/\*\*(.*?)\*\*/g, "<b style='color:#F0EAF7'>$1</b>") }}
              />
            </section>
          </Reveal>
        )}

        {/* ═══ MINI PIXEL GRID — all 12 months ═══ */}
        <Reveal>
          <section style={{ paddingBottom: 40 }}>
            <div className="ys-label" style={{ color: "var(--ink-3)", marginBottom: 16 }}>
              {th ? "ทุกวันของปี" : "Every day of the year"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "36px repeat(31, 1fr)", gap: 2 }}>
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
            {/* Legend */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
              {DEFAULT_MOODS.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
                  <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{th ? m.labelTh : m.label}</span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ═══ OUTRO ═══ */}
        <Reveal>
          <section style={{ padding: "80px 0 120px", textAlign: "center" }}>
            <p style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--ink)", lineHeight: 1.3, maxWidth: 500, margin: "0 auto 12px" }}>
              {th ? `ขอบคุณสำหรับปี ${year}` : `Thank you for ${year}`}
            </p>
            <p style={{ fontSize: 17, color: "var(--ink-3)", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.6 }}>
              {th ? "ทุกอารมณ์ที่คุณบันทึกคือก้าวหนึ่งของการเข้าใจตัวเอง" : "Every mood you logged is a step toward understanding yourself"}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href={"/year-in-pixels" as "/"} style={{ fontSize: 15, fontWeight: 700, color: "var(--purple)", textDecoration: "none" }}>
                ← {th ? "กลับ Year in Pixels" : "Back to Pixels"}
              </Link>
            </div>
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
