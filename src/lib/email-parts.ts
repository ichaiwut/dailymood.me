export const EMAIL_LOGO = `<div style="margin-bottom:32px;">
  <table cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="vertical-align:middle;padding-right:9px;">
      <img src="https://my.dailymood.me/icon.png" alt="" width="28" height="28" style="display:block;border-radius:8px;" />
    </td>
    <td style="vertical-align:middle;">
      <span style="font-size:17px;font-weight:800;color:#2C1B14;letter-spacing:-0.01em;">DailyMood</span>
    </td>
  </tr></table>
</div>`;

export function emailUnsubFooter(locale: string, feature: "aiCoach" | "weeklyDigest") {
  const th = locale === "th";
  const settingsUrl = feature === "weeklyDigest"
    ? "https://my.dailymood.me/insights"
    : "https://my.dailymood.me/insights";
  const label = feature === "weeklyDigest"
    ? (th ? "Weekly Digest" : "Weekly Digest")
    : (th ? "AI Coach" : "AI Coach");
  return `<p style="font-size:13px;color:#A8998A;margin:16px 0 0;text-align:center;line-height:1.5;">
    ${th ? `ไม่ต้องการรับ ${label} อีก? ` : `Don't want ${label} emails? `}<a href="${settingsUrl}" style="color:#A673F1;text-decoration:underline;">${th ? "ปิดได้ที่หน้า Insights" : "Turn off in Insights"}</a>
  </p>`;
}
