"use client";

import { useTranslations } from "next-intl";
import { NotFoundCharacter } from "./error-character";

export function NotFoundPage() {
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
            {t("404header")}
          </span>
        </div>
      </div>

      {/* body */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-5"
        style={{ paddingBottom: 60 }}
      >
        {/* character + big 404 */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <div className="fade-in">
            <NotFoundCharacter />
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
            404
          </div>
        </div>

        {/* copy */}
        <div className="fade-in" style={{ textAlign: "center", maxWidth: 340, animationDelay: "100ms" }}>
          <h1
            style={{
              fontSize: "var(--fs-xl)",
              fontWeight: 800,
              color: "var(--ink)",
              marginBottom: 4,
              lineHeight: 1.3,
            }}
          >
            {t("404title")}
          </h1>
          <p
            style={{
              fontSize: "var(--fs-md)",
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: 8,
            }}
          >
            {t("404subtitle")}
          </p>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--ink-3)",
              lineHeight: 1.6,
            }}
          >
            {t("404body")}
          </p>
        </div>

        {/* buttons */}
        <div
          className="fade-in"
          style={{ width: "100%", maxWidth: 340, marginTop: 40, display: "flex", flexDirection: "column", gap: 12, animationDelay: "200ms" }}
        >
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "0.95rem 1.5rem",
              borderRadius: "var(--radius-pill)",
              background: "var(--ink)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "var(--fs-md)",
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("404home")}
          </a>
          <a
            href="/profile?feedback=true"
            className="btn-ghost"
            style={{ textAlign: "center", textDecoration: "none", width: "100%" }}
          >
            {t("404report")}
          </a>
        </div>
      </div>
    </main>
  );
}
