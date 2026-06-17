import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/cf";
import { users, moodEntries } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { resend } from "@/lib/resend";
import { pushToUser } from "@/lib/push";


const FROM = "Dailymood <hello@dailymood.me>";
const APP_URL = process.env.NEXTAUTH_URL || "https://my.dailymood.me";
const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHH = String(now.getUTCHours() + 7).padStart(2, "0"); // ICT = UTC+7
  const currentMM = now.getUTCMinutes() < 30 ? "00" : "30";
  const currentTime = `${currentHH}:${currentMM}`;
  const currentDay = String(((now.getUTCDay() + (now.getUTCHours() + 7 >= 24 ? 1 : 0)) % 7));
  const today = toYmd(now);

  const db = getDb();

  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      locale: users.locale,
      reminderTime: users.reminderTime,
      reminderDays: users.reminderDays,
      reminderEmailEnabled: users.reminderEmailEnabled,
      reminderPushEnabled: users.reminderPushEnabled,
    })
    .from(users)
    .where(or(eq(users.reminderEmailEnabled, true), eq(users.reminderPushEnabled, true)));

  let sent = 0;
  let pushedCount = 0;
  for (const user of eligibleUsers) {
    if (user.reminderTime !== currentTime) continue;
    const days = user.reminderDays.split(",");
    if (!days.includes(currentDay)) continue;

    const [alreadyLogged] = await db
      .select({ id: moodEntries.id })
      .from(moodEntries)
      .where(and(eq(moodEntries.userId, user.id), eq(moodEntries.date, today)))
      .limit(1);

    if (alreadyLogged) continue;

    const locale = (user.locale as "en" | "th") || "en";

    // Independent channels: a user can get push, email, or both (per their toggles).
    // pushToUser is best-effort and never throws — 0 means "no device".
    let delivered = false;
    if (user.reminderPushEnabled) {
      const pushed = await pushToUser(user.id, reminderPush(locale));
      if (pushed > 0) { pushedCount++; delivered = true; }
    }
    if (user.reminderEmailEnabled) {
      const { subject, html } = reminderEmail(locale, user.name);
      try {
        await resend.emails.send({ from: FROM, to: user.email, subject, html });
        delivered = true;
      } catch {
        // skip failed sends
      }
    }
    if (delivered) sent++;
  }

  return NextResponse.json({ ok: true, sent, pushed: pushedCount, checked: eligibleUsers.length });
}

function toYmd(d: Date): string {
  const utc7 = new Date(d.getTime() + 7 * 3600000);
  return `${utc7.getUTCFullYear()}-${String(utc7.getUTCMonth() + 1).padStart(2, "0")}-${String(utc7.getUTCDate()).padStart(2, "0")}`;
}

function reminderPush(locale: "en" | "th") {
  if (locale === "th") {
    return {
      title: "วันนี้รู้สึกยังไงบ้าง?",
      body: "ยังไม่ได้บันทึกอารมณ์วันนี้เลย แวะมาบันทึกสักนิดไหม?",
      data: { type: "daily_reminder", url: "/" },
    };
  }
  return {
    title: "How are you feeling today?",
    body: "You haven't logged your mood today — take a moment to check in?",
    data: { type: "daily_reminder", url: "/" },
  };
}

function reminderEmail(locale: "en" | "th", name: string | null) {
  const firstName = name?.split(" ")[0] ?? "";
  if (locale === "th") {
    return {
      subject: `${firstName ? firstName + " — " : ""}วันนี้รู้สึกยังไงบ้าง?`,
      html: emailShell(
        firstName ? `${firstName} 👋` : "สวัสดี 👋",
        "วันนี้ยังไม่ได้บันทึกอารมณ์เลย แวะมาบันทึกสักนิดไหม?",
        { href: APP_URL, label: "บันทึกอารมณ์" },
        "ถ้าไม่อยากได้อีเมลนี้ ปิดได้ที่หน้าโปรไฟล์ > การแจ้งเตือน",
      ),
    };
  }
  return {
    subject: `${firstName ? firstName + " — " : ""}How are you feeling today?`,
    html: emailShell(
      firstName ? `${firstName} 👋` : "Hey 👋",
      "You haven't logged your mood today. Take a moment to check in with yourself?",
      { href: APP_URL, label: "Log your mood" },
      "To stop these emails, turn off reminders in your Profile.",
    ),
  };
}

function emailShell(title: string, body: string, button: { href: string; label: string }, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#F8F6FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0A0A;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:32px;color:#A673F1;">Dailymood</div>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;">${title}</h1>
      <p style="font-size:15px;line-height:1.55;margin:0 0 24px;color:#5A5A5A;">${body}</p>
      <a href="${button.href}" style="display:inline-block;background:#A673F1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:15px;">${button.label}</a>
      <p style="font-size:11px;line-height:1.5;margin:32px 0 0;color:#8C8C8C;">${footer}</p>
    </div></body></html>`;
}
