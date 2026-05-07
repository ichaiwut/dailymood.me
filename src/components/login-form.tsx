"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Step =
  | { kind: "email" }
  | { kind: "password"; email: string }
  | { kind: "register"; email: string }
  | { kind: "google_only"; email: string }
  | { kind: "verify_sent"; email: string };

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep({ kind: "email" });
    setError(null);
  }

  async function onCheckEmail(email: string) {
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await r.json()) as {
        exists?: boolean;
        hasPassword?: boolean;
        error?: string;
      };
      if (!r.ok) {
        setError(t("errInvalidEmail"));
        return;
      }
      if (!data.exists) setStep({ kind: "register", email });
      else if (data.hasPassword) setStep({ kind: "password", email });
      else setStep({ kind: "google_only", email });
    } finally {
      setBusy(false);
    }
  }

  async function onSignIn(email: string, password: string) {
    setError(null);
    setBusy(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (!res || res.error) {
      // NextAuth v5 surfaces our error code in `res.code`; v4 in `res.error`.
      const code = (res as { code?: string } | undefined)?.code ?? res?.error;
      if (code === "email_not_verified") setError(t("errNotVerified"));
      else setError(t("errInvalidCredentials"));
      return;
    }
    window.location.href = "/";
  }

  async function onRegister(email: string, name: string, password: string) {
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name, password, locale }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) {
        if (data.error === "weak_password") setError(t("errWeakPassword"));
        else if (data.error === "name_required") setError(t("errNameRequired"));
        else if (data.error === "email_taken") setError(t("errEmailTaken"));
        else if (data.error === "use_google") setStep({ kind: "google_only", email });
        else if (data.error === "invalid_email") setError(t("errInvalidEmail"));
        else if (data.error === "rate_limited") setError(t("errRateLimited"));
        else setError(t("errGeneric"));
        return;
      }
      setStep({ kind: "verify_sent", email });
    } finally {
      setBusy(false);
    }
  }

  async function onResendVerify(email: string) {
    setBusy(true);
    await fetch("/api/auth/resend-verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    setBusy(false);
    setError(t("resent"));
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <LogoMark />
      <h1
        className="leading-[1.1] mt-6"
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: "var(--ink)",
          letterSpacing: "-0.5px",
        }}
      >
        {t("welcome")}
      </h1>
      <p
        className="mt-3 text-base leading-snug"
        style={{ color: "var(--ink-2)" }}
      >
        {t("signInDescription")}
      </p>

      {step.kind === "email" && (
        <EmailStep
          busy={busy}
          error={error}
          onSubmit={onCheckEmail}
          onGoogle={() => signIn("google", { callbackUrl: "/" })}
          t={t}
        />
      )}

      {step.kind === "password" && (
        <PasswordStep
          email={step.email}
          busy={busy}
          error={error}
          onSubmit={(pwd) => onSignIn(step.email, pwd)}
          onBack={reset}
          t={t}
        />
      )}

      {step.kind === "register" && (
        <RegisterStep
          email={step.email}
          busy={busy}
          error={error}
          onSubmit={(name, pwd) => onRegister(step.email, name, pwd)}
          onBack={reset}
          t={t}
        />
      )}

      {step.kind === "google_only" && (
        <GoogleOnlyStep
          email={step.email}
          onGoogle={() => signIn("google", { callbackUrl: "/" })}
          onBack={reset}
          t={t}
        />
      )}

      {step.kind === "verify_sent" && (
        <VerifySentStep
          email={step.email}
          busy={busy}
          msg={error}
          onResend={() => onResendVerify(step.email)}
          onBack={reset}
          t={t}
        />
      )}
    </div>
  );
}

/* ─── steps ─── */

type T = ReturnType<typeof useTranslations<"auth">>;

function EmailStep({
  busy,
  error,
  onSubmit,
  onGoogle,
  t,
}: {
  busy: boolean;
  error: string | null;
  onSubmit: (email: string) => void;
  onGoogle: () => void;
  t: T;
}) {
  const [email, setEmail] = useState("");
  return (
    <form
      className="mt-7 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email);
      }}
    >
      <button
        type="button"
        onClick={onGoogle}
        className="w-full inline-flex items-center justify-center gap-3 rounded-full px-5 py-3 text-base font-semibold transition active:scale-[0.98]"
        style={{
          background: "var(--surface)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <GoogleIcon />
        {t("continueWithGoogle")}
      </button>

      <Divider label={t("or")} />

      <Input
        type="email"
        autoFocus
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={setEmail}
        label={t("email")}
      />
      <PrimaryButton busy={busy} disabled={!email}>
        {t("continue")}
      </PrimaryButton>
      <ErrorLine msg={error} />
    </form>
  );
}

function PasswordStep({
  email,
  busy,
  error,
  onSubmit,
  onBack,
  t,
}: {
  email: string;
  busy: boolean;
  error: string | null;
  onSubmit: (pwd: string) => void;
  onBack: () => void;
  t: T;
}) {
  const [pwd, setPwd] = useState("");
  return (
    <form
      className="mt-7 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(pwd);
      }}
    >
      <EmailRow email={email} onBack={onBack} backLabel={t("back")} />
      <Input
        type="password"
        autoFocus
        autoComplete="current-password"
        placeholder={t("passwordPlaceholder")}
        value={pwd}
        onChange={setPwd}
        label={t("password")}
      />
      <PrimaryButton busy={busy} disabled={pwd.length < 1}>
        {t("signIn")}
      </PrimaryButton>
      <div className="text-center pt-1">
        <Link
          href="/auth/forgot"
          className="text-base font-medium"
          style={{ color: "var(--ink-2)" }}
        >
          {t("forgotPassword")}
        </Link>
      </div>
      <ErrorLine msg={error} />
    </form>
  );
}

function RegisterStep({
  email,
  busy,
  error,
  onSubmit,
  onBack,
  t,
}: {
  email: string;
  busy: boolean;
  error: string | null;
  onSubmit: (name: string, pwd: string) => void;
  onBack: () => void;
  t: T;
}) {
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  return (
    <form
      className="mt-7 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name, pwd);
      }}
    >
      <EmailRow email={email} onBack={onBack} backLabel={t("back")} />
      <Input
        type="text"
        autoFocus
        autoComplete="name"
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={setName}
        label={t("name")}
      />
      <Input
        type="password"
        autoComplete="new-password"
        placeholder={t("passwordPlaceholder")}
        value={pwd}
        onChange={setPwd}
        label={t("password")}
      />
      <PrimaryButton busy={busy} disabled={!name || pwd.length < 8}>
        {t("createAccount")}
      </PrimaryButton>
      <ErrorLine msg={error} />
    </form>
  );
}

function GoogleOnlyStep({
  email,
  onGoogle,
  onBack,
  t,
}: {
  email: string;
  onGoogle: () => void;
  onBack: () => void;
  t: T;
}) {
  return (
    <div className="mt-7 space-y-3">
      <EmailRow email={email} onBack={onBack} backLabel={t("back")} />
      <p
        className="text-base leading-snug"
        style={{ color: "var(--ink-2)" }}
      >
        {t("useGoogleInstead")}
      </p>
      <button
        type="button"
        onClick={onGoogle}
        className="w-full inline-flex items-center justify-center gap-3 rounded-full px-5 py-3 text-base font-semibold"
        style={{
          background: "var(--ink)",
          color: "var(--primary-on)",
        }}
      >
        <GoogleIcon />
        {t("continueWithGoogle")}
      </button>
    </div>
  );
}

function VerifySentStep({
  email,
  busy,
  msg,
  onResend,
  onBack,
  t,
}: {
  email: string;
  busy: boolean;
  msg: string | null;
  onResend: () => void;
  onBack: () => void;
  t: T;
}) {
  return (
    <div className="mt-7 space-y-3">
      <h2
        className="font-bold tracking-tight text-xl"
        style={{ color: "var(--ink)" }}
      >
        {t("checkInbox")}
      </h2>
      <p className="text-base leading-snug" style={{ color: "var(--ink-2)" }}>
        {t("verifySent", { email })}
      </p>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 text-base font-medium rounded-full"
          style={{ background: "var(--surface)", color: "var(--ink)" }}
        >
          {t("back")}
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={busy}
          className="flex-1 px-5 py-3 text-base font-semibold rounded-full"
          style={{
            background: "var(--ink)",
            color: "var(--primary-on)",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {t("resendEmail")}
        </button>
      </div>
      {msg && (
        <p className="text-base" style={{ color: "var(--ink-3)" }}>
          {msg}
        </p>
      )}
    </div>
  );
}

/* ─── primitives ─── */

function Input({
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

function PrimaryButton({
  busy,
  disabled,
  children,
}: {
  busy?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="w-full px-5 py-3 text-base font-semibold rounded-full transition active:scale-[0.98]"
      style={{
        background: "#FCA45B",
        color: "#fff",
        boxShadow: "0 10px 24px rgba(252,164,91,0.4)",
        opacity: busy || disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function EmailRow({
  email,
  onBack,
  backLabel,
}: {
  email: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
      style={{ background: "var(--surface-2)" }}
    >
      <span
        className="text-base truncate"
        style={{ color: "var(--ink)" }}
      >
        {email}
      </span>
      <button
        type="button"
        onClick={onBack}
        className="text-base font-medium ml-3 shrink-0"
        style={{ color: "var(--ink-2)" }}
      >
        {backLabel}
      </button>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative py-2">
      <div
        aria-hidden
        className="absolute inset-0 flex items-center"
      >
        <span
          className="w-full"
          style={{ height: 1, background: "var(--hairline)" }}
        />
      </div>
      <div className="relative flex justify-center">
        <span
          className="px-3 text-sm"
          style={{ background: "var(--bg)", color: "var(--ink-3)" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function ErrorLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p
      className="text-base text-center"
      style={{ color: "#D14343" }}
    >
      {msg}
    </p>
  );
}

function LogoMark() {
  const colors = ["#A673F1", "#FCA45B", "#85ECCB", "#FDCB56"];
  return (
    <span
      aria-hidden
      className="grid grid-cols-2"
      style={{ width: 28, height: 28, gap: 4 }}
    >
      {colors.map((c, i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{ width: 11, height: 11, background: c }}
        />
      ))}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
