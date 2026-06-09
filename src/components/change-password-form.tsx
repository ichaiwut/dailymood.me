"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export function ChangePasswordForm() {
  const locale = useLocale();
  const th = locale === "th";
  const router = useRouter();

  // null = still loading whether the account has a password
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/account/password")
      .then((r) => (r.ok ? (r.json() as Promise<{ hasPassword: boolean }>) : null))
      .then((d) => setHasPassword(d?.hasPassword ?? false))
      .catch(() => setHasPassword(false));
  }, []);

  const title = hasPassword
    ? th ? "เปลี่ยนรหัสผ่าน" : "Change password"
    : th ? "ตั้งรหัสผ่าน" : "Set a password";

  const intro = hasPassword
    ? th ? "ใส่รหัสผ่านเดิมเพื่อยืนยันตัวตน แล้วตั้งรหัสใหม่" : "Enter your current password, then choose a new one."
    : th ? "คุณเข้าสู่ระบบด้วย Google อยู่ — ตั้งรหัสผ่านไว้เพื่อเข้าสู่ระบบด้วยอีเมลได้ด้วย" : "You sign in with Google — set a password so you can also log in with email.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (next.length < 8) {
      setError(th ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" : "Password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError(th ? "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" : "The new passwords don't match.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: hasPassword ? current : undefined,
        newPassword: next,
      }),
    });
    setBusy(false);

    if (res.ok) {
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
      return;
    }

    const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
    setError(errorMessage(j.error, j.retryAfterSec, th));
  }

  // ── Success state ──
  if (done) {
    return (
      <div className="pa-wrap center-720 fade-in" style={{ paddingBottom: 60 }}>
        <BackButton th={th} />
        <div className="pa-sheet" style={{ borderRadius: 18, padding: "44px 28px", textAlign: "center", position: "relative", overflow: "visible" }}>
          <span className="pa-washi mint" aria-hidden />
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--w-ink)", margin: "0 0 8px" }}>
            {hasPassword
              ? th ? "เปลี่ยนรหัสผ่านแล้ว" : "Password changed"
              : th ? "ตั้งรหัสผ่านเรียบร้อย" : "Password set"}
          </h1>
          <p style={{ fontSize: 15, color: "var(--w-ink-2)", lineHeight: 1.55, margin: "0 auto 22px", maxWidth: 340 }}>
            {hasPassword
              ? th ? "ครั้งหน้าใช้รหัสผ่านใหม่เข้าสู่ระบบได้เลย" : "Use your new password next time you log in."
              : th ? "ตอนนี้คุณเข้าสู่ระบบด้วยอีเมล + รหัสผ่าน หรือ Google ก็ได้" : "You can now log in with email + password, or Google."}
          </p>
          <button type="button" className="pa-btn purple" onClick={() => router.push("/profile" as "/")} style={{ height: "auto", padding: "11px 22px" }}>
            {th ? "กลับไปโปรไฟล์" : "Back to profile"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pa-wrap center-720 fade-in" style={{ paddingBottom: 60 }}>
      <BackButton th={th} />

      <h1 style={{ fontSize: "clamp(24px, 5vw, 30px)", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
        {title}
      </h1>
      <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 26px", maxWidth: 460 }}>
        {intro}
      </p>

      {hasPassword === null ? (
        <div className="pa-sheet skeleton-pulse" style={{ height: 220, borderRadius: 18 }} />
      ) : (
        <form onSubmit={onSubmit}>
          <div className="pa-sheet" style={{ borderRadius: 18, padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {hasPassword && (
              <Field
                label={th ? "รหัสผ่านเดิม" : "Current password"}
                value={current}
                onChange={setCurrent}
                autoComplete="current-password"
                placeholder={th ? "รหัสผ่านที่ใช้อยู่" : "Your current password"}
                autoFocus
              />
            )}
            <Field
              label={th ? "รหัสผ่านใหม่" : "New password"}
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              placeholder={th ? "อย่างน้อย 8 ตัวอักษร" : "At least 8 characters"}
              autoFocus={!hasPassword}
            />
            <Field
              label={th ? "ยืนยันรหัสผ่านใหม่" : "Confirm new password"}
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder={th ? "พิมพ์รหัสผ่านใหม่อีกครั้ง" : "Re-type the new password"}
            />

            {error && (
              <p style={{ fontSize: 14, fontWeight: 600, color: "#D14343", margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={busy || next.length < 8 || !confirm || (hasPassword === true && !current)}
              className="pa-btn ink"
              style={{
                width: "100%", height: 48,
                opacity: busy || next.length < 8 || !confirm || (hasPassword === true && !current) ? 0.55 : 1,
              }}
            >
              {busy
                ? th ? "กำลังบันทึก..." : "Saving..."
                : hasPassword
                ? th ? "บันทึกรหัสผ่านใหม่" : "Save new password"
                : th ? "ตั้งรหัสผ่าน" : "Set password"}
            </button>

            {hasPassword && (
              <Link
                href={"/auth/forgot" as "/"}
                style={{ fontSize: 14, fontWeight: 700, color: "var(--purple-strong)", textDecoration: "none", textAlign: "center" }}
              >
                {th ? "ลืมรหัสผ่านเดิม?" : "Forgot your current password?"}
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function errorMessage(code: string | undefined, retryAfterSec: number | undefined, th: boolean): string {
  switch (code) {
    case "wrong_current_password":
      return th ? "รหัสผ่านเดิมไม่ถูกต้อง" : "Your current password is incorrect.";
    case "current_password_required":
      return th ? "กรุณาใส่รหัสผ่านเดิม" : "Please enter your current password.";
    case "same_password":
      return th ? "รหัสผ่านใหม่ต้องไม่เหมือนรหัสเดิม" : "The new password must be different from the old one.";
    case "weak_password":
      return th ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" : "Password must be at least 8 characters.";
    case "rate_limited": {
      const min = Math.ceil((retryAfterSec ?? 900) / 60);
      return th ? `ลองมากเกินไป ลองใหม่อีกครั้งใน ${min} นาที` : `Too many attempts. Try again in ${min} min.`;
    }
    default:
      return th ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again.";
  }
}

function BackButton({ th }: { th: boolean }) {
  return (
    <Link
      href={"/profile" as "/"}
      className="pa-icon-btn"
      aria-label={th ? "กลับไปโปรไฟล์" : "Back to profile"}
      style={{ textDecoration: "none", marginBottom: 22 }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function Field({
  label, value, onChange, placeholder, autoFocus, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)", marginBottom: 8 }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          style={{
            width: "100%", padding: "12px 44px 12px 14px", borderRadius: 14,
            border: "1.5px solid var(--w-rule)", background: "var(--w-surface-2)",
            fontSize: 15, color: "var(--w-ink)", outline: "none", fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide" : "Show"}
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--w-ink-3)",
          }}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4 10 7a13 13 0 01-2.3 3.3M6.1 6.1A13 13 0 002 12c1 3 5 7 10 7a9.5 9.5 0 003.6-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
          )}
        </button>
      </div>
    </label>
  );
}
