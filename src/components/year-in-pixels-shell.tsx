"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { AiDisclaimer } from "./ai-disclaimer";
import { PASticker } from "./paper/pa-sticker";

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

const MONTH_LABELS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTH_FULL_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getMoodColor(moodId: string | undefined) {
  if (!moodId) return "var(--w-tint)";
  return DEFAULT_MOODS.find((m) => m.id === moodId)?.color ?? "var(--w-tint)";
}

function getMoodLabel(moodId: string, locale: string): string | null {
  if (!moodId) return null;
  const m = DEFAULT_MOODS.find((d) => d.id === moodId);
  if (!m) return null;
  return locale === "th" ? m.labelTh : m.label;
}

const paperOutlineBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 16px",
  borderRadius: 12, border: "1.5px solid var(--w-rule)", background: "var(--w-surface)", cursor: "pointer",
  fontFamily: "inherit", fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)",
};

interface Props {
  tier: Tier;
  pack?: string;
  iconFormat?: string;
}

export function YearInPixelsShell({ tier, pack = DEFAULT_MOOD_PACK, iconFormat = "svg" }: Props) {
  const locale = useLocale();
  const t = useTranslations("yearPixels");
  const tc = useTranslations("calendar");
  const isTh = locale === "th";
  const monthLabels = isTh ? MONTH_LABELS_TH : MONTH_LABELS_EN;
  const monthFull = isTh ? MONTH_FULL_TH : MONTH_FULL_EN;

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [compareData, setCompareData] = useState<YearData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const isPremium = tier === "premium";

  const fetchData = useCallback(async (year: number) => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/year-in-pixels?year=${year}`);
      if (res.ok) {
        const json = await res.json() as YearData;
        setData(json);
      }
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isPremium) fetchData(viewYear);
    else setLoading(false);
  }, [viewYear, isPremium, fetchData]);

  async function handleExport() {
    if (!gridRef.current || !data) return;
    const CELL = 18, GAP = 2, PAD = 24, LABEL_W = 50, COLS = 31;
    const w = PAD * 2 + LABEL_W + COLS * (CELL + GAP);
    const h = PAD * 2 + 30 + 12 * (CELL + GAP) + 40;
    const canvas = document.createElement("canvas");
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillStyle = "#1A1320";
    ctx.fillText(`Year in Pixels · ${viewYear}`, PAD, PAD + 14);
    ctx.font = "bold 11px system-ui, sans-serif";
    for (let d = 0; d < 31; d++) {
      ctx.fillStyle = "#8C8497";
      ctx.textAlign = "center";
      ctx.fillText(String(d + 1), PAD + LABEL_W + d * (CELL + GAP) + CELL / 2, PAD + 28);
    }
    for (let mi = 0; mi < 12; mi++) {
      const y = PAD + 34 + mi * (CELL + GAP);
      ctx.fillStyle = "#1A1320";
      ctx.textAlign = "left";
      ctx.fillText(monthLabels[mi], PAD, y + CELL / 2 + 4);
      const days = daysInMonth(viewYear, mi + 1);
      for (let d = 0; d < 31; d++) {
        const x = PAD + LABEL_W + d * (CELL + GAP);
        if (d >= days) continue;
        const dateStr = `${viewYear}-${String(mi + 1).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
        const moodId = data.dayMap[dateStr];
        ctx.fillStyle = getMoodColor(moodId) === "var(--w-tint)" ? "#F4EEE6" : getMoodColor(moodId);
        ctx.beginPath();
        ctx.roundRect(x, y, CELL, CELL, 3);
        ctx.fill();
      }
    }
    const link = document.createElement("a");
    link.download = `year-in-pixels-${viewYear}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleCompare() {
    if (compareData || compareLoading) { setCompareData(null); return; }
    setCompareLoading(true);
    try {
      const res = await fetch(`/api/year-in-pixels?year=${viewYear - 1}&locale=${locale}`);
      if (res.ok) setCompareData(await res.json() as YearData);
    } catch { /* noop */ }
    setCompareLoading(false);
  }

  function handleDownloadPdf() {
    if (!data) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const ai = data.aiSummary;
    const monthNames = isTh ? MONTH_FULL_TH : MONTH_FULL_EN;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Year in Pixels ${viewYear}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;color:#1A1320;line-height:1.6}
      h1{font-size:28px}h2{font-size:20px;margin-top:32px;color:#7A4DD0}
      .grid{display:grid;grid-template-columns:50px repeat(31,18px);gap:2px;margin:24px 0}
      .cell{width:18px;height:18px;border-radius:3px}
      .stat{display:inline-block;background:#F4F2F7;padding:8px 16px;border-radius:12px;margin:4px 8px 4px 0;font-weight:700}
      p{margin:8px 0}b{font-weight:800}</style></head><body>
      <h1>Year in Pixels · ${viewYear}</h1>
      <p>${data.totalDays} / ${data.daysInYear} ${isTh ? "วัน" : "days"}</p>
      ${ai ? `<h2>AI ${isTh ? "สรุปทั้งปี" : "Year Summary"}</h2><p>${ai.summary.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")}</p>
      ${ai.yearTheme ? `<p>🏷️ ${ai.yearTheme}</p>` : ""}
      ${ai.bestQuarter ? `<p><b>${isTh ? "ช่วงที่ดีที่สุด:" : "Best period:"}</b> ${ai.bestQuarter}</p>` : ""}
      ${ai.hardestPeriod ? `<p><b>${isTh ? "ช่วงที่ท้าทาย:" : "Hardest period:"}</b> ${ai.hardestPeriod}</p>` : ""}` : ""}
      <h2>${isTh ? "สถิติ" : "Stats"}</h2>
      <div><span class="stat">😊 ${getMoodLabel(data.dominantMood, locale) ?? "—"} · ${data.dominantPct}%</span>
      <span class="stat">🔥 Streak ${data.streak.days} ${isTh ? "วัน" : "days"}</span>
      <span class="stat">📝 ${data.totalDays} ${isTh ? "ครั้ง" : "entries"}</span>
      ${data.topTrigger ? `<span class="stat">💡 "${data.topTrigger.tag}" · ${data.topTrigger.count}×</span>` : ""}</div>
      ${data.bestMonth ? `<p><b>${isTh ? "เดือนที่ดีที่สุด:" : "Best month:"}</b> ${monthNames[data.bestMonth.month - 1]} (${data.bestMonth.avg}/5)</p>` : ""}
      ${data.hardMonth ? `<p><b>${isTh ? "เดือนที่ท้าทาย:" : "Hardest month:"}</b> ${monthNames[data.hardMonth.month - 1]} (${data.hardMonth.avg}/5)</p>` : ""}
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  }

  if (!isPremium) {
    return (
      <div className="pa-wrap fade-in" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <div className="pa-sheet" style={{ borderRadius: 18, textAlign: "center", padding: "56px 24px", maxWidth: 520, margin: "0 auto", position: "relative" }}>
          <span className="pa-washi lav" aria-hidden style={{ width: 110, top: -12 }} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--w-ink)", marginBottom: 8 }}>Year in Pixels</h1>
          <p style={{ fontSize: 16, color: "var(--w-ink-2)", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>
            {isTh ? "ดูอารมณ์ทั้งปีในมุมมอง pixel — ทุกวันคือ 1 สี ค้นพบ pattern และ insight จากอารมณ์ของคุณ" : "See your whole year as pixels — every day is a color. Discover patterns and insights from your moods."}
          </p>
          <Link href={"/pricing" as "/"} className="pa-btn purple" style={{ textDecoration: "none", height: 46, padding: "0 26px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {isTh ? "อัปเกรดเป็น Pro" : "Upgrade to Pro"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pa-wrap fade-in" style={{ paddingTop: 16, paddingBottom: 80 }}>
      {/* View Toggle (paper pills) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Link href={"/calendar" as "/"} className="pa-filter" style={{ textDecoration: "none" }}>{tc("tabCalendar")}</Link>
        <Link href={"/calendar" as "/"} className="pa-filter" style={{ textDecoration: "none" }}>{tc("tabTimeline")}</Link>
        <span className="pa-filter active">{tc("tabYear")}</span>
      </div>

      {/* Header */}
      <div className="yip-header-row" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--purple)", letterSpacing: "0.5px", marginBottom: 4 }}>
            YEAR IN PIXELS · {viewYear}
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
            {isTh ? "ภาพรวมทั้งปี" : "Full Year Overview"}
          </h1>
          {data && (
            <p style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 6 }}>
              {data.totalDays} / {data.daysInYear} {isTh ? "วัน · กดเซลล์เพื่อดูรายละเอียด" : "days · click a cell for details"}
            </p>
          )}
        </div>
        <div className="yip-nav-btns" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setViewYear((y) => y - 1)} className="pa-filter">← {viewYear - 1}</button>
          <button onClick={() => setViewYear((y) => y + 1)} className="pa-filter">{viewYear + 1} →</button>
          <button onClick={handleExport} disabled={!data} className="pa-btn ink" style={{ height: 40, opacity: !data ? 0.5 : 1 }}>
            📸 Export PNG
          </button>
        </div>
      </div>

      {/* AI Summary Card */}
      {data && (
        <div
          className="fade-in yip-ai-card pa-sheet"
          style={{
            borderRadius: 18,
            padding: "24px 24px 20px",
            background: "var(--w-ai-grad)",
            marginBottom: 24,
            position: "relative",
          }}
        >
          <span className="pa-washi yellow" aria-hidden style={{ width: 100 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, var(--purple), #C9A6F5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", letterSpacing: "0.3px" }}>
                AI {isTh ? "สรุปทั้งปี" : "Year Summary"} · {viewYear}
              </span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", background: "var(--w-chip)", padding: "4px 12px", borderRadius: 100 }}>
              ✨ Pro
            </span>
          </div>

          {data.aiSummary ? (
            <>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--w-ink)", lineHeight: 1.6, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: data.aiSummary.summary.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
              {data.aiSummary.yearTheme && (
                <div style={{ fontSize: 14, color: "var(--purple-strong)", fontWeight: 700, marginBottom: 10 }}>
                  🏷️ {data.aiSummary.yearTheme}
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <AiDisclaimer variant="analysis" />
              </div>
            </>
          ) : (
            <p style={{ fontSize: 16, color: "var(--w-ink-2)", lineHeight: 1.6, marginBottom: 20 }}>
              {isTh ? "บันทึกอย่างน้อย 20 วัน เพื่อให้ AI สรุปภาพรวมปีให้คุณ" : "Log at least 20 days to get an AI year summary"}
            </p>
          )}

          {/* Mini stat chips */}
          <div className="yip-stat-chips" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "var(--w-chip)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginBottom: 2 }}>😊 {isTh ? "อารมณ์เด่น" : "Dominant"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--w-ink)" }}>{data.dominantMood ? `${getMoodLabel(data.dominantMood, locale) ?? "—"} · ${data.dominantPct}%` : "—"}</div>
            </div>
            <div style={{ background: "var(--w-chip)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginBottom: 2 }}>🔥 Streak {isTh ? "สูงสุด" : "best"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--w-ink)" }}>{data.streak.days} {isTh ? "วัน" : "days"}{data.streak.month > 0 ? ` · ${monthLabels[data.streak.month - 1]}` : ""}</div>
            </div>
            <div style={{ background: "var(--w-chip)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginBottom: 2 }}>📝 {isTh ? "บันทึกทั้งหมด" : "Total entries"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--w-ink)" }}>{data.totalDays} {isTh ? "ครั้ง" : "entries"}</div>
            </div>
            <div style={{ background: "var(--w-chip)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginBottom: 2 }}>💡 Trigger {isTh ? "เด่น" : "top"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--w-ink)" }}>{data.topTrigger ? `"${data.topTrigger.tag}" · ${data.topTrigger.count} ${isTh ? "ครั้ง" : "×"}` : "—"}</div>
            </div>
          </div>

          {/* Compare with previous year */}
          {compareData && compareData.totalDays === 0 ? (
            <div className="fade-in" style={{ marginBottom: 16, background: "var(--w-chip)", borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--w-ink)" }}>
                {isTh ? `ยังไม่มีข้อมูลปี ${viewYear - 1}` : `No data for ${viewYear - 1}`}
              </div>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 4 }}>
                {isTh ? "เริ่มบันทึกอารมณ์เพื่อดูการเปรียบเทียบ" : "Start logging to see comparisons"}
              </div>
            </div>
          ) : compareData ? (
            <div className="fade-in" style={{ marginBottom: 16, background: "var(--w-chip)", borderRadius: 16, padding: "20px 22px" }}>
              {/* Header + year legend */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--purple-strong)" }}>
                  📊 {isTh ? `เปรียบเทียบ ${viewYear} กับ ${viewYear - 1}` : `${viewYear} vs ${viewYear - 1}`}
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "#A673F1" }} />
                    <span style={{ color: "var(--w-ink)" }}>{viewYear}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "#D4BEE4" }} />
                    <span style={{ color: "var(--w-ink-3)" }}>{viewYear - 1}</span>
                  </span>
                </div>
              </div>
              {/* Metric rows */}
              {[
                {
                  emoji: "📝", label: isTh ? "บันทึก" : "Entries",
                  currVal: data.totalDays, prevVal: compareData.totalDays,
                  maxVal: Math.max(data.totalDays, compareData.totalDays, 1),
                  currLabel: `${data.totalDays} ${isTh ? "วัน" : "days"}`,
                  prevLabel: `${compareData.totalDays} ${isTh ? "วัน" : "days"}`,
                  delta: data.totalDays - compareData.totalDays as number | null,
                  deltaUnit: isTh ? "วัน" : "days",
                  barColor: "#A673F1",
                },
                {
                  emoji: "😊", label: isTh ? "อารมณ์เด่น" : "Dominant",
                  currVal: data.dominantPct, prevVal: compareData.dominantPct,
                  maxVal: 100,
                  currLabel: data.dominantMood ? `${getMoodLabel(data.dominantMood, locale) ?? "—"} ${data.dominantPct}%` : "—",
                  prevLabel: compareData.dominantMood ? `${getMoodLabel(compareData.dominantMood, locale) ?? "—"} ${compareData.dominantPct}%` : "—",
                  delta: null as number | null,
                  deltaUnit: "",
                  barColor: data.dominantMood ? getMoodColor(data.dominantMood) : "#D4BEE4",
                },
                {
                  emoji: "🔥", label: isTh ? "สถิติต่อเนื่อง" : "Streak",
                  currVal: data.streak.days, prevVal: compareData.streak.days,
                  maxVal: Math.max(data.streak.days, compareData.streak.days, 1),
                  currLabel: `${data.streak.days} ${isTh ? "วัน" : "days"}`,
                  prevLabel: `${compareData.streak.days} ${isTh ? "วัน" : "days"}`,
                  delta: data.streak.days - compareData.streak.days as number | null,
                  deltaUnit: isTh ? "วัน" : "days",
                  barColor: "#FCA45B",
                },
                {
                  emoji: "⭐", label: isTh ? "เดือนที่ดีที่สุด" : "Best month",
                  currVal: data.bestMonth?.avg ?? 0, prevVal: compareData.bestMonth?.avg ?? 0,
                  maxVal: 5,
                  currLabel: data.bestMonth ? `${monthFull[data.bestMonth.month - 1]} · ${data.bestMonth.avg}/5` : "—",
                  prevLabel: compareData.bestMonth ? `${monthFull[compareData.bestMonth.month - 1]} · ${compareData.bestMonth.avg}/5` : "—",
                  delta: null as number | null,
                  deltaUnit: "",
                  barColor: "#85ECCB",
                },
              ].map((r, i, arr) => {
                const currPct = r.maxVal > 0 ? Math.max((r.currVal / r.maxVal) * 100, r.currVal > 0 ? 5 : 0) : 0;
                const prevPct = r.maxVal > 0 ? Math.max((r.prevVal / r.maxVal) * 100, r.prevVal > 0 ? 5 : 0) : 0;
                return (
                  <div key={r.label} style={{ padding: "14px 0", borderTop: i > 0 ? "1px solid rgba(0,0,0,.05)" : "none" }}>
                    {/* Label + delta badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--w-ink-2)" }}>{r.emoji} {r.label}</span>
                      {r.delta != null && r.delta !== 0 && (
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: r.delta > 0 ? "#34A853" : "#D14343",
                          background: r.delta > 0 ? "rgba(52,168,83,.1)" : "rgba(209,67,67,.1)",
                          padding: "2px 8px", borderRadius: 6,
                        }}>
                          {r.delta > 0 ? "↑ +" : "↓ "}{Math.abs(r.delta)}{r.deltaUnit ? ` ${r.deltaUnit}` : ""}
                        </span>
                      )}
                    </div>
                    {/* Side-by-side bars */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 10px", alignItems: "center" }}>
                      <div style={{ height: 10, borderRadius: 5, background: "rgba(0,0,0,.04)", overflow: "hidden" }}>
                        <div style={{ width: `${currPct}%`, height: "100%", borderRadius: 5, background: r.barColor, transition: "width 600ms ease" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--w-ink)", whiteSpace: "nowrap" }}>{r.currLabel}</span>
                      <div style={{ height: 10, borderRadius: 5, background: "rgba(0,0,0,.04)", overflow: "hidden" }}>
                        <div style={{ width: `${prevPct}%`, height: "100%", borderRadius: 5, background: "#D4BEE4", opacity: 0.5, transition: "width 600ms ease" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--w-ink-3)", whiteSpace: "nowrap" }}>{r.prevLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Action buttons */}
          {data.aiSummary && (
            <div className="yip-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/year-in-pixels/story?year=${viewYear}` as "/"} className="pa-btn purple" style={{ height: 40, textDecoration: "none" }}>
                {isTh ? "เล่าให้ฟังต่อ" : "Tell me more"} →
              </Link>
              <button onClick={handleCompare} style={paperOutlineBtn}>
                {compareLoading ? "..." : `📊 ${isTh ? `เปรียบเทียบกับ ${viewYear - 1}` : `Compare with ${viewYear - 1}`}`}
              </button>
              <button onClick={handleDownloadPdf} style={paperOutlineBtn}>
                🪄 {isTh ? "ดาวน์โหลด AI report (PDF)" : "Download AI report (PDF)"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="pa-sheet" style={{ borderRadius: 18, padding: 40, textAlign: "center" }}>
          <div className="pulse" style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--purple), #C9A6F5)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--w-ink)" }}>{isTh ? "กำลังโหลดข้อมูล..." : "Loading data..."}</div>
        </div>
      )}

      {/* Grid */}
      {data && (
        <>
          <div style={{ position: "relative" }}>
          <span className="pa-tab">{tc("tabYear")}</span>
          <div ref={gridRef} className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "24px 20px", overflowX: "auto" }}>
            <div style={{ minWidth: 720 }}>
              {/* Day numbers header */}
              <div style={{ display: "grid", gridTemplateColumns: "50px repeat(31, 1fr)", gap: 2, marginBottom: 4 }}>
                <div />
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: "var(--w-ink-3)" }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Month rows */}
              {Array.from({ length: 12 }, (_, mi) => {
                const month = mi + 1;
                const days = daysInMonth(viewYear, month);
                return (
                  <div key={mi} style={{ display: "grid", gridTemplateColumns: "50px repeat(31, 1fr)", gap: 2, marginBottom: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-ink)", display: "flex", alignItems: "center" }}>
                      {monthLabels[mi]}
                    </div>
                    {Array.from({ length: 31 }, (_, di) => {
                      const day = di + 1;
                      if (day > days) return <div key={di} />;
                      const dateStr = `${viewYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const moodId = data.dayMap[dateStr];
                      const color = getMoodColor(moodId);
                      const isToday = dateStr === new Date().toISOString().slice(0, 10);
                      const isHovered = hoveredCell === dateStr;
                      const isSelected = selectedCell === dateStr;

                      return (
                        <div
                          key={di}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedCell(selectedCell === dateStr ? null : dateStr)}
                          onMouseEnter={() => setHoveredCell(dateStr)}
                          onMouseLeave={() => setHoveredCell(null)}
                          title={`${day} ${monthFull[mi]}${moodId ? ` — ${getMoodLabel(moodId, locale)}` : ""}`}
                          style={{
                            aspectRatio: "1",
                            borderRadius: 4,
                            background: color,
                            border: isSelected ? "2px solid var(--w-ink)" : isToday ? "2px solid var(--purple)" : isHovered ? "2px solid var(--w-ink-3)" : "none",
                            cursor: "pointer",
                            transition: "transform 100ms",
                            transform: isHovered ? "scale(1.3)" : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend + dominant mood */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--w-rule)" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {DEFAULT_MOODS.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink-2)" }}>{isTh ? m.labelTh : m.label}</span>
                  </div>
                ))}
              </div>
              {data.dominantMood && (
                <div style={{ fontSize: 14, color: "var(--w-ink-2)" }}>
                  {isTh ? "อารมณ์เด่นของปี:" : "Dominant mood:"}{" "}
                  <strong style={{ color: "var(--w-ink)" }}>{getMoodLabel(data.dominantMood, locale)}</strong>
                  {" · "}{data.dominantPct}%
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Selected cell tooltip */}
          {selectedCell && (() => {
            const selMoodId = data.dayMap[selectedCell];
            const selMood = selMoodId ? DEFAULT_MOODS.find((m) => m.id === selMoodId) : null;
            return (
              <div className="pa-sheet fade-in" style={{ marginTop: 12, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                {selMood && <PASticker moodId={selMood.id} color={selMood.color} size={36} borderWidth={3} pack={pack} iconFormat={iconFormat} />}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--w-ink)" }}>
                    {new Date(selectedCell + "T12:00:00").toLocaleDateString(isTh ? "th-TH" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--w-ink-2)" }}>
                    {selMoodId ? getMoodLabel(selMoodId, locale) : (isTh ? "ไม่มีบันทึก" : "No entry")}
                  </div>
                </div>
                {selMoodId && (
                  <Link href={`/calendar` as "/"} style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", textDecoration: "none" }}>
                    {isTh ? "ดูบันทึก →" : "View entry →"}
                  </Link>
                )}
              </div>
            );
          })()}

          {/* Stats cards */}
          <div className="yip-stats-bottom" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20 }}>
            {data.bestMonth && (
              <div className="pa-sheet" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginBottom: 4 }}>
                  {isTh ? "เดือนที่ดีที่สุด" : "Best month"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--w-ink)" }}>
                  {monthFull[data.bestMonth.month - 1]}
                </div>
                <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 2 }}>
                  {data.bestMonth.avg} / 5
                </div>
              </div>
            )}
            {data.hardMonth && (
              <div className="pa-sheet" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginBottom: 4 }}>
                  {isTh ? "เดือนที่ต่อสู้มาก" : "Hardest month"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--w-ink)" }}>
                  {monthFull[data.hardMonth.month - 1]}
                </div>
                <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 2 }}>
                  {data.hardMonth.avg} / 5
                </div>
              </div>
            )}
            <div className="pa-sheet" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginBottom: 4 }}>
                {isTh ? "แนวโน้ม Q4" : "Q4 Trend"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--w-ink)" }}>
                {data.trendQ4.pct > 0 ? (isTh ? "ดีขึ้นเรื่อย ๆ" : "Improving") : data.trendQ4.pct < 0 ? (isTh ? "ลดลง" : "Declining") : (isTh ? "คงที่" : "Stable")}
              </div>
              <div style={{ fontSize: 14, color: data.trendQ4.pct >= 0 ? "#34A853" : "#D14343", fontWeight: 700, marginTop: 2 }}>
                {data.trendQ4.pct >= 0 ? "+" : ""}{data.trendQ4.pct}%
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
