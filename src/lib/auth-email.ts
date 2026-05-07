import { resend } from "./resend";

const FROM = "Dailymood <hello@dailymood.me>";
const APP_URL = process.env.NEXTAUTH_URL || "https://my.dailymood.me";

type Locale = "en" | "th";

export async function sendVerifyEmail(opts: {
  to: string;
  token: string;
  locale: Locale;
}) {
  const link = `${APP_URL}/auth/verify?token=${encodeURIComponent(opts.token)}`;
  const { subject, html } =
    opts.locale === "th" ? verifyTh(link) : verifyEn(link);

  await resend.emails.send({ from: FROM, to: opts.to, subject, html });
}

export async function sendResetEmail(opts: {
  to: string;
  token: string;
  locale: Locale;
}) {
  const link = `${APP_URL}/auth/reset?token=${encodeURIComponent(opts.token)}`;
  const { subject, html } =
    opts.locale === "th" ? resetTh(link) : resetEn(link);

  await resend.emails.send({ from: FROM, to: opts.to, subject, html });
}

/* ─── Templates ─── */

function shell(title: string, body: string, button: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F4EFE5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2C1B14;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:32px;">Dailymood</div>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">${title}</h1>
      <p style="font-size:15px;line-height:1.55;margin:0 0 24px;color:#6B5848;">${body}</p>
      <a href="${button.href}" style="display:inline-block;background:#2C1B14;color:#FFF5E6;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">${button.label}</a>
      <p style="font-size:12px;line-height:1.5;margin:32px 0 0;color:#A8998A;">If the button doesn't work, copy this link:<br><span style="word-break:break-all;">${button.href}</span></p>
    </div></body></html>`;
}

function verifyEn(link: string) {
  return {
    subject: "Verify your Dailymood email",
    html: shell(
      "Verify your email",
      "Click the button below to confirm your email and finish creating your Dailymood account. This link expires in 24 hours.",
      { href: link, label: "Verify email" },
    ),
  };
}

function verifyTh(link: string) {
  return {
    subject: "ยืนยัน email ของคุณที่ Dailymood",
    html: shell(
      "ยืนยัน email ของคุณ",
      "กดปุ่มด้านล่างเพื่อยืนยัน email และสร้างบัญชี Dailymood ให้เรียบร้อย ลิงก์นี้หมดอายุใน 24 ชั่วโมง",
      { href: link, label: "ยืนยัน email" },
    ),
  };
}

function resetEn(link: string) {
  return {
    subject: "Reset your Dailymood password",
    html: shell(
      "Reset your password",
      "Click the button below to set a new password. This link expires in 1 hour. If you didn't request this, you can ignore this email.",
      { href: link, label: "Reset password" },
    ),
  };
}

function resetTh(link: string) {
  return {
    subject: "รีเซ็ตรหัสผ่านที่ Dailymood",
    html: shell(
      "รีเซ็ตรหัสผ่าน",
      "กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์นี้หมดอายุใน 1 ชั่วโมง ถ้าคุณไม่ได้ขอ สามารถละเว้น email ฉบับนี้ได้",
      { href: link, label: "ตั้งรหัสผ่านใหม่" },
    ),
  };
}
