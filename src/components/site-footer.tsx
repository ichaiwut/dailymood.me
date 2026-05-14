import { getLocale } from "next-intl/server";

export async function SiteFooter() {
  const locale = await getLocale();
  const isTh = locale === "th";
  const year = new Date().getFullYear();

  return (
    <footer className="desktop-footer" style={{
      borderTop: "1px solid var(--hairline, #F2F0F5)",
      padding: "16px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 14,
      color: "var(--ink-3, #999)",
      maxWidth: 1180,
      margin: "0 auto",
      width: "100%",
    }}>
      <div>© {year} DailyMood.me</div>
      <div style={{ display: "flex", gap: 24 }}>
        <a href="/about" style={{ color: "inherit", textDecoration: "none" }}>
          {isTh ? "เกี่ยวกับเรา" : "About"}
        </a>
        <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>
          {isTh ? "นโยบายความเป็นส่วนตัว" : "Privacy"}
        </a>
        <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>
          {isTh ? "เงื่อนไขการใช้งาน" : "Terms"}
        </a>
        <a href="/privacy#pdpa" style={{ color: "inherit", textDecoration: "none" }}>
          PDPA
        </a>
      </div>
    </footer>
  );
}
