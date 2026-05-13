import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users, moodEntries } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { moodScore, ymd, addDays } from "@/lib/mood-scores";
import { generateCoachTip } from "@/lib/gemini";
import { resend } from "@/lib/resend";

const FROM = "Dailymood AI Coach <hello@dailymood.me>";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Protect with secret (Railway cron or manual trigger)
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Find users with AI Coach enabled + premium
  const enabledUsers = await db
    .select({
      id: users.id,
      email: users.email,
      locale: users.locale,
      name: users.name,
    })
    .from(users)
    .where(and(eq(users.aiCoachEnabled, true), eq(users.isPremium, true)))
    .limit(100);

  let sent = 0;
  let failed = 0;

  for (const user of enabledUsers) {
    try {
      const locale = user.locale ?? "th";
      const start = ymd(addDays(new Date(), -14));

      const rows = await db
        .select({
          moodTypeId: moodEntries.moodTypeId,
          tags: moodEntries.tags,
          date: moodEntries.date,
        })
        .from(moodEntries)
        .where(and(eq(moodEntries.userId, user.id), gte(moodEntries.date, start)))
        .orderBy(desc(moodEntries.createdAt))
        .limit(30);

      if (rows.length < 3) continue;

      const moodCounts: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};
      for (const r of rows) {
        moodCounts[r.moodTypeId] = (moodCounts[r.moodTypeId] ?? 0) + 1;
        for (const t of (r.tags as string[] | null) ?? []) {
          tagCounts[t] = (tagCounts[t] ?? 0) + 1;
        }
      }

      const scores = rows.map((r) => moodScore(r.moodTypeId));
      const avgMood = +(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
      const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, c]) => `${t}:${c}`);
      const recentMoods = rows.slice(0, 5).map((r) => ({ d: r.date, m: r.moodTypeId }));

      const payload = JSON.stringify({ locale, avgMood, moods: moodCounts, topTags, recentMoods });
      const tip = await generateCoachTip(payload);

      const html = coachEmailHtml({
        name: user.name ?? "",
        emoji: tip.emoji,
        title: tip.title,
        tip: tip.tip,
        locale,
      });

      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `${tip.emoji} ${tip.title}`,
        html,
      });

      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: enabledUsers.length });
}

function coachEmailHtml(opts: { name: string; emoji: string; title: string; tip: string; locale: string }) {
  const greeting = opts.locale === "th"
    ? `สวัสดี${opts.name ? ` ${opts.name}` : ""} 👋`
    : `Hey${opts.name ? ` ${opts.name}` : ""} 👋`;
  const footer = opts.locale === "th"
    ? "จาก AI Coach ของคุณที่ Dailymood"
    : "From your AI Coach at Dailymood";

  return `<!doctype html><html><body style="margin:0;background:#F4EFE5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2C1B14;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:32px;">Dailymood</div>
      <p style="font-size:15px;color:#6B5848;margin:0 0 20px;">${greeting}</p>
      <div style="background:#fff;border-radius:18px;padding:24px;border:1.5px solid #F2F0F5;">
        <div style="font-size:32px;margin-bottom:8px;">${opts.emoji}</div>
        <h2 style="font-size:20px;font-weight:800;margin:0 0 10px;color:#2C1B14;">${opts.title}</h2>
        <p style="font-size:15px;line-height:1.6;margin:0;color:#6B5848;">${opts.tip}</p>
      </div>
      <p style="font-size:13px;color:#A8998A;margin:24px 0 0;">${footer}</p>
    </div></body></html>`;
}
