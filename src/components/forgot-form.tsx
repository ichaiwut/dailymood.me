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

  return (
    <div className="w-full max-w-sm">
      <h1
        className="font-bold tracking-tight"
        style={{
          fontSize: "clamp(1.7rem, 3.6vw, 2.1rem)",
          color: "var(--ink)",
          letterSpacing: "-0.025em",
        }}
      >
        {t("forgotTitle")}
      </h1>
      <p className="mt-2 text-base leading-snug" style={{ color: "var(--ink-2)" }}>
        {sent ? t("forgotSent", { email }) : t("forgotBody")}
      </p>

      {!sent && (
        <form className="mt-7 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--ink-2)" }}
            >
              {t("email")}
            </span>
            <input
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full px-4 py-3 text-base focus:outline-none"
              style={{
                background: "var(--surface)",
                color: "var(--ink)",
                borderRadius: 14,
                border: "1px solid var(--hairline)",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !email}
            className="w-full px-5 py-3 text-base font-semibold rounded-full transition active:scale-[0.98]"
            style={{
              background: "var(--ink)",
              color: "var(--primary-on)",
              opacity: busy || !email ? 0.55 : 1,
            }}
          >
            {t("sendResetLink")}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-base font-medium"
          style={{ color: "var(--ink-2)" }}
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
