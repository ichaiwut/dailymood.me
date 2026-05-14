"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ForgotForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    setBusy(false);
    setSent(true);
  }

  async function onResend() {
    setBusy(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        {/* Back */}
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1.5px solid var(--hairline, #F2F0F5)",
            background: "var(--surface, #fff)",
            marginBottom: 40,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* Check icon */}
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#85ECCB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h1
          className="text-center font-bold"
          style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}
        >
          {locale === "th" ? "ส่งลิงก์ให้แล้ว" : "Link sent!"}
        </h1>
        <p className="text-center" style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 4 }}>
          {locale === "th" ? "เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่" : "We sent a reset link to"}
        </p>
        <p className="text-center" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
          {email}
        </p>
        <p className="text-center" style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
          {locale === "th" ? "เปิดอีเมลและคลิกลิงก์ภายใน 15 นาที" : "Open your email and click the link within 15 minutes"}
        </p>

        {/* Open email app */}
        <div style={{ marginTop: 40 }}>
          <a
            href="mailto:"
            className="block w-full text-center font-semibold transition active:scale-[0.98]"
            style={{
              background: "#FCA45B",
              color: "#fff",
              borderRadius: 100,
              padding: "14px 0",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {locale === "th" ? "เปิดแอปอีเมล" : "Open email app"}
          </a>
        </div>

        {/* Resend */}
        <div className="mt-4 text-center">
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
            {locale === "th" ? "ไม่ได้รับอีเมล? " : "Didn't get the email? "}
          </span>
          <button
            type="button"
            onClick={onResend}
            disabled={busy}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {locale === "th" ? "ส่งอีกครั้ง" : "Resend"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      {/* Back */}
      <Link
        href="/login"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 12,
          border: "1.5px solid var(--hairline, #F2F0F5)",
          background: "var(--surface, #fff)",
          marginBottom: 32,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {/* Sparkles */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 14 }}>✦</span>
        <span style={{ fontSize: 14, marginLeft: 2 }}>✦</span>
        <span style={{ fontSize: 16, marginLeft: 2 }}>✦</span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
        {t("forgotTitle")}
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 28 }}>
        {t("forgotBody")}
      </p>

      {/* Form */}
      <form onSubmit={onSubmit}>
        <label className="block" style={{ marginBottom: 16 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 }}>
            {t("email")}
          </span>
          <input
            type="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="w-full focus:outline-none"
            style={{
              padding: "14px 16px",
              fontSize: 15,
              background: "var(--surface, #fff)",
              color: "var(--ink)",
              borderRadius: 14,
              border: "1.5px solid var(--hairline, #F2F0F5)",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={busy || !email}
          className="w-full transition active:scale-[0.98]"
          style={{
            background: "#FCA45B",
            color: "#fff",
            borderRadius: 100,
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 700,
            border: "none",
            cursor: busy || !email ? "default" : "pointer",
            opacity: busy || !email ? 0.55 : 1,
          }}
        >
          {busy
            ? (locale === "th" ? "กำลังส่ง..." : "Sending...")
            : t("sendResetLink")}
        </button>
      </form>

      {/* Back to login */}
      <div className="mt-5 text-center">
        <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
          {locale === "th" ? "จำรหัสผ่านได้แล้ว? " : "Remember your password? "}
        </span>
        <Link
          href="/login"
          style={{ fontSize: 14, fontWeight: 700, color: "#A673F1", textDecoration: "none" }}
        >
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}
