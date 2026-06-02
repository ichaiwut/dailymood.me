import { EMAIL_LOGO } from "./email-parts";

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-f0f688a68f884179942645789862cf54.r2.dev";

/** Public URL of the trial-promo image (JPEG — WebP isn't safe in email clients). */
export const PROMO_IMAGE_URL = `${R2_PUBLIC_URL}/promo/trial-14d.jpg`;

/**
 * "Try Pro free for 14 days" promo email for users who are not Pro and have
 * never started a trial. The hero image is Thai-only; surrounding copy and the
 * subject are localized by the user's locale.
 */
export function trialPromoEmail(opts: {
  name?: string | null;
  locale: string;
  ctaUrl: string;
  unsubUrl: string;
}): { subject: string; html: string } {
  const th = opts.locale === "th";
  const name = opts.name?.trim();

  const subject = th
    ? "ลองใช้ Pro ฟรี 14 วัน — ไม่ต้องใช้บัตร"
    : "Try Pro free for 14 days — no card needed";

  const greeting = th
    ? `สวัสดี${name ? ` ${name}` : ""} 👋`
    : `Hey${name ? ` ${name}` : ""} 👋`;

  const lead = th
    ? "เปิดใช้ Pro ฟรี 14 วัน ปลดล็อกอินไซต์รายสัปดาห์ AI Coach และฟีเจอร์ Pro ทั้งหมด ไม่ต้องกรอกบัตร ไม่มีตัดเงินอัตโนมัติ"
    : "Turn on Pro free for 14 days — unlock weekly insights, AI Coach, and every Pro feature. No card, no auto-charge.";

  const ctaLabel = th ? "เปิดใช้ฟรี" : "Start free";

  const fineprint = th
    ? "กดเปิดใช้ในแอปได้เลย ใช้ครบ 14 วันแล้วกลับเป็นฟรีเองอัตโนมัติ"
    : "Activate inside the app — after 14 days it simply returns to free.";

  const unsubLine = th
    ? `ไม่อยากรับอีเมลแนะนำแบบนี้? <a href="${opts.unsubUrl}" style="color:#A673F1;text-decoration:underline;">ยกเลิกได้ที่นี่</a>`
    : `Don't want emails like this? <a href="${opts.unsubUrl}" style="color:#A673F1;text-decoration:underline;">Unsubscribe</a>`;

  const html = `<!doctype html><html><body style="margin:0;background:#F4EFE5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2C1B14;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      ${EMAIL_LOGO}
      <p style="font-size:15px;color:#6B5848;margin:0 0 20px;">${greeting}</p>
      <a href="${opts.ctaUrl}" style="display:block;text-decoration:none;">
        <img src="${PROMO_IMAGE_URL}" alt="${th ? "ทดลอง Pro 14 วัน ไม่ใช้บัตร" : "Try Pro for 14 days, no card"}" width="472" style="display:block;width:100%;max-width:472px;height:auto;border-radius:18px;border:0;" />
      </a>
      <p style="font-size:16px;line-height:1.6;margin:24px 0 20px;color:#2C1B14;">${lead}</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 32px;background:#2C1B14;color:#FFF5E6;border-radius:100px;font-size:16px;font-weight:700;text-decoration:none;">${ctaLabel} →</a>
      </div>
      <p style="font-size:13px;color:#A8998A;margin:0;text-align:center;line-height:1.5;">${fineprint}</p>
      <p style="font-size:13px;color:#A8998A;margin:24px 0 0;text-align:center;line-height:1.5;">${unsubLine}</p>
    </div></body></html>`;

  return { subject, html };
}
