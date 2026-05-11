"use client";

import { useTranslations } from "next-intl";
import { ForbiddenCharacter } from "./error-character";

export function ForbiddenPage() {
  const t = useTranslations("errors");

  return (
    <main
      className="flex-1 flex flex-col"
      style={{ background: "var(--bg-grad)", backgroundColor: "var(--bg)" }}
    >
      {/* header */}
      <div className="px-5 pt-5 pb-4">
        <div className="mx-auto w-full max-w-[768px] flex items-center gap-3">
          <a
            href="/"
            className="icon-btn"
            style={{ width: 40, height: 40, borderRadius: 12, textDecoration: "none" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 12H5M11 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
            {t("403header")}
          </span>
        </div>
      </div>

      {/* body */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-5"
        style={{ paddingBottom: 60 }}
      >
        {/* character + big 403 */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <div className="fade-in">
            <ForbiddenCharacter />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -20,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "clamp(80px, 20vw, 120px)",
              fontWeight: 800,
              color: "var(--purple)",
              opacity: 0.08,
              lineHeight: 1,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            403
          </div>
        </div>

        {/* copy */}
        <div className="fade-in" style={{ textAlign: "center", maxWidth: 340, animationDelay: "100ms" }}>
          <div
            style={{
              fontSize: "var(--fs-sm)",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              color: "var(--purple)",
              marginBottom: 8,
            }}
          >
            {t("403label")}
          </div>
          <h1
            style={{
              fontSize: "var(--fs-xl)",
              fontWeight: 800,
              color: "var(--ink)",
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            {t("403title")}
          </h1>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--ink-3)",
              lineHeight: 1.6,
            }}
          >
            {t("403body")}
          </p>
        </div>

        {/* buttons */}
        <div
          className="fade-in"
          style={{ width: "100%", maxWidth: 340, marginTop: 40, display: "flex", flexDirection: "column", gap: 12, animationDelay: "200ms" }}
        >
          <a
            href="/login"
            className="btn-purple"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              textDecoration: "none",
              boxShadow: "0 8px 20px rgba(166,115,241,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" opacity="0.2" />
              <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {t("403switch")}
          </a>
          <a
            href="/"
            className="btn-ghost"
            style={{ textAlign: "center", textDecoration: "none", width: "100%" }}
          >
            {t("403back")}
          </a>
        </div>
      </div>
    </main>
  );
}
