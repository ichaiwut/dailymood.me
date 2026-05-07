"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type State = "loading" | "ok" | "fail";

export function VerifyClient({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) {
      setState("fail");
      return;
    }
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => setState(r.ok ? "ok" : "fail"))
      .catch(() => setState("fail"));
  }, [token]);

  return (
    <div className="w-full max-w-sm text-center">
      {state === "loading" && (
        <p className="text-base" style={{ color: "var(--ink-2)" }}>
          {t("verifying")}
        </p>
      )}
      {state === "ok" && (
        <>
          <h1
            className="font-bold tracking-tight"
            style={{
              fontSize: "clamp(1.7rem, 3.6vw, 2.1rem)",
              color: "var(--ink)",
              letterSpacing: "-0.025em",
            }}
          >
            {t("verifyOk")}
          </h1>
          <Link
            href="/login"
            className="inline-block mt-6 px-6 py-3 text-base font-semibold rounded-full"
            style={{ background: "var(--ink)", color: "var(--primary-on)" }}
          >
            {t("goToLogin")}
          </Link>
        </>
      )}
      {state === "fail" && (
        <>
          <h1
            className="font-bold tracking-tight"
            style={{
              fontSize: "clamp(1.7rem, 3.6vw, 2.1rem)",
              color: "var(--ink)",
              letterSpacing: "-0.025em",
            }}
          >
            {t("verifyFailed")}
          </h1>
          <Link
            href="/login"
            className="inline-block mt-6 px-6 py-3 text-base font-semibold rounded-full"
            style={{ background: "var(--surface)", color: "var(--ink)", boxShadow: "var(--shadow-card)" }}
          >
            {t("goToLogin")}
          </Link>
        </>
      )}
    </div>
  );
}
