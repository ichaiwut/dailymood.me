import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users, moodEntries, insightsAiCache } from "@/db/schema";
import { and, eq, gte, desc, or } from "drizzle-orm";
import { moodScore, ymd, addDays, computeStreak, isoWeekKey } from "@/lib/mood-scores";
import { generateInsights } from "@/lib/gemini";
import type { InsightsAiResult } from "@/db/schema";
import { resend } from "@/lib/resend";
import { pushToUser } from "@/lib/push";
import { EMAIL_LOGO, emailUnsubFooter } from "@/lib/email-parts";

const FROM = "Dailymood <hello@dailymood.me>";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const enabledUsers = await db
    .select({
      id: users.id,
      email: users.email,
      locale: users.locale,
      name: users.name,
      weeklyDigestEmailEnabled: users.weeklyDigestEmailEnabled,
      weeklyDigestPushEnabled: users.weeklyDigestPushEnabled,
      lastDigestWeekKey: users.lastDigestWeekKey,
    })
    .from(users)
    .where(and(or(eq(users.weeklyDigestEmailEnabled, true), eq(users.weeklyDigestPushEnabled, true)), eq(users.isPremium, true)))
    .limit(100);

  const lastWeekKey = isoWeekKey(addDays(new Date(), -7));
  let sent = 0;
  let failed = 0;

  for (const user of enabledUsers) {
    try {
      if (user.lastDigestWeekKey === lastWeekKey) continue; // already sent this week
      const locale = user.locale ?? "th";
      const start = ymd(addDays(new Date(), -13));

      const rows = await db
        .select({
          moodTypeId: moodEntries.moodTypeId,
          tags: moodEntries.tags,
          note: moodEntries.note,
          sentiment: moodEntries.sentiment,
          date: moodEntries.date,
          createdAt: moodEntries.createdAt,
        })
        .from(moodEntries)
        .where(and(eq(moodEntries.userId, user.id), gte(moodEntries.date, start)))
        .orderBy(desc(moodEntries.createdAt))
        .limit(50);

      if (rows.length < 3) continue;

      let weekly: InsightsAiResult | null = null;

      const [cached] = await db
        .select()
        .from(insightsAiCache)
        .where(and(eq(insightsAiCache.userId, user.id), eq(insightsAiCache.weekKey, lastWeekKey)))
        .limit(1);

      if (cached) {
        weekly = cached.result;
      } else {
        const moodCounts: Record<string, number> = {};
        const tagCounts: Record<string, number> = {};
        let sentSum = 0, sentN = 0;
        for (const r of rows) {
          moodCounts[r.moodTypeId] = (moodCounts[r.moodTypeId] ?? 0) + 1;
          for (const t of (r.tags as string[] | null) ?? []) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
          if (r.sentiment != null) { sentSum += r.sentiment; sentN++; }
        }
        const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, c]) => `${t}:${c}`);
        const recent = rows.slice(0, 10).map((r) => ({ d: r.date, m: r.moodTypeId, n: r.note?.slice(0, 60) ?? null }));
        const payload = JSON.stringify({ locale, n: rows.length, avgSent: sentN ? +(sentSum / sentN).toFixed(2) : null, moods: moodCounts, tags: topTags, recent });

        try {
          const raw = await generateInsights(payload);
          weekly = {
            headline: raw.headline,
            previewHeadline: raw.previewHeadline,
            summary: raw.summary,
            patterns: raw.patterns.map((p) => ({ title: p.title, description: p.description, tag: p.tag as "pattern" | "correlation" | "alert", miniVizData: p.miniVizData })),
            suggestion: raw.suggestion,
          };
        } catch {
          continue;
        }
      }

      if (!weekly) continue;

      const scores = rows.map((r) => moodScore(r.moodTypeId));
      const avgMood = +(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
      const streak = computeStreak(new Set(rows.map((r) => r.date)));
      const totalEntries = rows.length;

      const html = digestEmailHtml({
        name: user.name ?? "",
        headline: weekly.headline,
        summary: weekly.summary,
        patterns: weekly.patterns.slice(0, 3),
        suggestion: weekly.suggestion,
        avgMood,
        streak,
        totalEntries,
        locale,
      });

      const subject = locale === "th"
        ? `📊 สรุปสัปดาห์ — ${weekly.headline}`
        : `📊 Weekly Digest — ${weekly.headline}`;

      // Independent channels: push and/or email per the user's toggles.
      let delivered = false;
      if (user.weeklyDigestPushEnabled) {
        const pushed = await pushToUser(user.id, {
          title: locale === "th" ? "📊 สรุปสัปดาห์" : "📊 Weekly Digest",
          body: weekly.headline,
          data: { type: "weekly_digest", url: "/insights" },
        });
        if (pushed > 0) delivered = true;
      }
      if (user.weeklyDigestEmailEnabled) {
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: subject.slice(0, 120),
          html,
        });
        delivered = true;
      }

      // Mark processed for the week only if a channel went out.
      if (delivered) {
        await db.update(users).set({ lastDigestWeekKey: lastWeekKey }).where(eq(users.id, user.id));
        sent++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: enabledUsers.length });
}

function digestEmailHtml(opts: {
  name: string;
  headline: string;
  summary: string;
  patterns: { title: string; description: string; tag: string }[];
  suggestion: { title: string; description: string } | null;
  avgMood: number;
  streak: number;
  totalEntries: number;
  locale: string;
}) {
  const th = opts.locale === "th";
  const greeting = th
    ? `สวัสดี${opts.name ? ` ${opts.name}` : ""} 👋`
    : `Hey${opts.name ? ` ${opts.name}` : ""} 👋`;
  const footer = th
    ? "จาก Dailymood — สรุปให้ทุกวันจันทร์"
    : "From Dailymood — your Monday digest";
  const unsub = emailUnsubFooter(opts.locale, "weeklyDigest");

  const statsRow = `
    <div style="display:flex;gap:12px;margin-bottom:20px;">
      <div style="flex:1;background:#FAF7FE;border-radius:12px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#A673F1;">${opts.avgMood}</div>
        <div style="font-size:12px;color:#8C8497;margin-top:2px;">${th ? "อารมณ์เฉลี่ย" : "Avg Mood"}</div>
      </div>
      <div style="flex:1;background:#FFF4EB;border-radius:12px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#FCA45B;">🔥 ${opts.streak}</div>
        <div style="font-size:12px;color:#8C8497;margin-top:2px;">Streak</div>
      </div>
      <div style="flex:1;background:#F0FBF6;border-radius:12px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#85ECCB;">${opts.totalEntries}</div>
        <div style="font-size:12px;color:#8C8497;margin-top:2px;">${th ? "บันทึก" : "Entries"}</div>
      </div>
    </div>`;

  const patternsHtml = opts.patterns.length > 0
    ? `<div style="margin-top:16px;">
        <div style="font-size:13px;font-weight:800;color:#8C8497;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">${th ? "แพทเทิร์นที่พบ" : "Patterns"}</div>
        ${opts.patterns.map((p) => `
          <div style="padding:8px 0;border-bottom:1px solid #F2F0F5;">
            <div style="font-size:14px;font-weight:700;color:#2C1B14;">${p.title}</div>
            <div style="font-size:13px;color:#6B5848;margin-top:2px;">${p.description}</div>
          </div>
        `).join("")}
      </div>`
    : "";

  const suggestionHtml = opts.suggestion
    ? `<div style="margin-top:16px;padding:14px;background:#FAFFF8;border:1px solid #DEF1D5;border-radius:12px;">
        <div style="font-size:12px;font-weight:800;color:#4A8C3F;letter-spacing:0.5px;margin-bottom:4px;">${th ? "ลองดู" : "TRY THIS"}</div>
        <div style="font-size:14px;font-weight:700;color:#2C1B14;">${opts.suggestion.title}</div>
        <div style="font-size:13px;color:#6B5848;margin-top:2px;">${opts.suggestion.description}</div>
      </div>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#F4EFE5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2C1B14;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      ${EMAIL_LOGO}
      <p style="font-size:15px;color:#6B5848;margin:0 0 20px;">${greeting}</p>
      <div style="background:#fff;border-radius:18px;padding:24px;border:1.5px solid #F2F0F5;">
        <div style="font-size:14px;font-weight:800;color:#A673F1;letter-spacing:0.3px;margin-bottom:6px;">📊 ${th ? "สรุปสัปดาห์" : "WEEKLY DIGEST"}</div>
        <h2 style="font-size:20px;font-weight:800;margin:0 0 10px;color:#2C1B14;">${opts.headline}</h2>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#6B5848;">${opts.summary}</p>
        ${statsRow}
        ${patternsHtml}
        ${suggestionHtml}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://my.dailymood.me/insights" style="display:inline-block;padding:12px 28px;background:#A673F1;color:#fff;border-radius:100px;font-size:14px;font-weight:700;text-decoration:none;">${th ? "ดูเพิ่มเติม" : "View full insights"}</a>
      </div>
      <p style="font-size:13px;color:#A8998A;margin:24px 0 0;text-align:center;">${footer}</p>
      ${unsub}
    </div></body></html>`;
}
