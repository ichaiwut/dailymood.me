import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyUnsub } from "@/lib/email-unsub";

/** Mark a user as opted-out of marketing email. Returns the user's locale, or null if invalid. */
async function optOut(userId: string, sig: string): Promise<string | null> {
  if (!verifyUnsub(userId, sig)) return null;
  const db = getDb();
  const [row] = await db
    .update(users)
    .set({ marketingOptOut: true })
    .where(eq(users.id, userId))
    .returning({ locale: users.locale });
  if (!row) return null;
  return row.locale ?? "en";
}

/** Human click → opt out + show a small confirmation page. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("u") ?? "";
  const sig = searchParams.get("sig") ?? "";
  const locale = await optOut(userId, sig);

  const th = locale === "th";
  const ok = locale !== null;
  const title = ok
    ? th ? "ยกเลิกเรียบร้อย" : "You're unsubscribed"
    : th ? "ลิงก์ไม่ถูกต้อง" : "Invalid link";
  const body = ok
    ? th
      ? "เราจะไม่ส่งอีเมลแนะนำฟีเจอร์ถึงคุณอีก อีเมลสำคัญ เช่น การยืนยันบัญชี ยังส่งตามปกติ"
      : "We won't send you feature emails anymore. Important emails like account confirmations will still arrive."
    : th
      ? "ลิงก์นี้หมดอายุหรือไม่ถูกต้อง ลองกดจากอีเมลฉบับล่าสุดอีกครั้ง"
      : "This link is expired or invalid. Try the link from your latest email.";

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
  <body style="margin:0;background:#F4EFE5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2C1B14;">
    <div style="max-width:480px;margin:0 auto;padding:64px 24px;text-align:center;">
      <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:32px;">Dailymood</div>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">${title}</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 28px;color:#6B5848;">${body}</p>
      <a href="https://my.dailymood.me" style="display:inline-block;background:#2C1B14;color:#FFF5E6;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">${th ? "กลับไปที่แอป" : "Back to the app"}</a>
    </div></body></html>`;

  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** RFC 8058 one-click (Gmail/Yahoo) → opt out, no body needed. */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("u") ?? "";
  const sig = searchParams.get("sig") ?? "";
  const locale = await optOut(userId, sig);
  if (locale === null) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
