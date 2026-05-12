import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const locale = await getLocale();
    redirect({ href: "/", locale });
  }

  return (
    <div className="auth-split">
      <div className="auth-brand">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={32} height={32} viewBox="0 0 32 32">
            <defs>
              <linearGradient id="dmlg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FCA45B" /><stop offset=".5" stopColor="#FBA0A0" /><stop offset="1" stopColor="#A673F1" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#dmlg)" />
            <circle cx="12" cy="14" r="1.6" fill="#1A1320" />
            <circle cx="20" cy="14" r="1.6" fill="#1A1320" />
            <path d="M 11 20 Q 16 24 21 20" stroke="#1A1320" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 22 }}>DailyMood</span>
        </div>
        <div>
          <h1 style={{ fontSize: 50, fontWeight: 800, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            เข้าใจ<br />ตัวเอง<br />ทุกวัน
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, margin: "20px 0 0", maxWidth: 380, lineHeight: 1.5 }}>
            บันทึกอารมณ์ 10 วินาที AI วิเคราะห์ให้ — มี Year-in-Pixels อวดได้ปลายปี
          </p>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["great", "good", "okay", "meh", "bad"].map((face, i) => (
            <div
              key={face}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(255,255,255,.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateY(${[0, -10, -16, -10, 0][i]}px)`,
                fontSize: 28,
              }}
            >
              {["😄", "🙂", "😐", "😓", "😢"][i]}
            </div>
          ))}
        </div>
      </div>
      <main className="auth-form">
        <LoginForm />
      </main>
    </div>
  );
}
