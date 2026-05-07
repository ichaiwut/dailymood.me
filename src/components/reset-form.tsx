"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) {
      setError(t("errWeakPassword"));
      return;
    }
    if (pwd !== confirm) {
      setError(t("errPasswordMismatch"));
      return;
    }
    setBusy(true);
    const r = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password: pwd }),
    });
    setBusy(false);
    if (r.ok) setDone(true);
    else setError(t("errResetFailed"));
  }

  if (!token) {
    return (
      <Wrap>
        <h1 className="font-bold tracking-tight" style={titleStyle}>
          {t("errResetFailed")}
        </h1>
        <BackToLogin label={t("goToLogin")} />
      </Wrap>
    );
  }

  if (done) {
    return (
      <Wrap>
        <h1 className="font-bold tracking-tight" style={titleStyle}>
          {t("resetOk")}
        </h1>
        <BackToLogin label={t("goToLogin")} />
      </Wrap>
    );
  }

  return (
    <Wrap>
      <h1 className="font-bold tracking-tight" style={titleStyle}>
        {t("resetTitle")}
      </h1>
      <p className="mt-2 text-base leading-snug" style={{ color: "var(--ink-2)" }}>
        {t("resetBody")}
      </p>
      <form className="mt-7 space-y-3" onSubmit={onSubmit}>
        <Field
          label={t("newPassword")}
          type="password"
          autoComplete="new-password"
          value={pwd}
          onChange={setPwd}
          placeholder={t("passwordPlaceholder")}
          autoFocus
        />
        <Field
          label={t("confirmPassword")}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          placeholder={t("passwordPlaceholder")}
        />
        <button
          type="submit"
          disabled={busy || pwd.length < 8 || !confirm}
          className="w-full px-5 py-3 text-base font-semibold rounded-full transition active:scale-[0.98]"
          style={{
            background: "var(--ink)",
            color: "var(--primary-on)",
            opacity: busy || pwd.length < 8 || !confirm ? 0.55 : 1,
          }}
        >
          {t("saveNewPassword")}
        </button>
        {error && (
          <p className="text-base text-center" style={{ color: "#D14343" }}>
            {error}
          </p>
        )}
      </form>
    </Wrap>
  );
}

const titleStyle = {
  fontSize: "clamp(1.7rem, 3.6vw, 2.1rem)",
  color: "var(--ink)",
  letterSpacing: "-0.025em",
} as const;

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-sm">{children}</div>;
}

function BackToLogin({ label }: { label: string }) {
  return (
    <Link
      href="/login"
      className="inline-block mt-6 px-6 py-3 text-base font-semibold rounded-full"
      style={{ background: "var(--ink)", color: "var(--primary-on)" }}
    >
      {label}
    </Link>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoFocus,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span
        className="block text-sm font-medium mb-1.5"
        style={{ color: "var(--ink-2)" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 text-base focus:outline-none"
        style={{
          background: "var(--surface)",
          color: "var(--ink)",
          borderRadius: 14,
          border: "1px solid var(--hairline)",
        }}
      />
    </label>
  );
}
