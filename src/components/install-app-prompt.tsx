"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { BottomSheet } from "./bottom-sheet";
import { trackAppDownloadClick, trackAppPromptShown } from "@/lib/analytics";
import { R2_PUBLIC_URL as R2 } from "@/lib/moods";

// One-time prompt pointing iOS users at the native App Store app.
// There is no Android app yet, so non-iOS users get nothing (the old PWA
// add-to-home-screen guide was removed). Uses its own dismiss key — NOT the
// retired "pwa-install-dismissed" — so users who dismissed the old guide are
// still shown this once.
const LS_KEY = "ios-app-prompt-dismissed";
const APP_STORE_URL = "https://apps.apple.com/th/app/dailymood-mood-journal/id6778759803";

function detectIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function InstallAppPrompt() {
  const locale = useLocale();
  const isTh = locale === "th";
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!detectIOS()) return;
      if (localStorage.getItem(LS_KEY)) return;
      setShow(true);
      trackAppPromptShown("ios");
    } catch {}
  }, []);

  function dismiss() {
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    setShow(false);
  }

  function onDownload() {
    trackAppDownloadClick("ios");
    dismiss();
  }

  return (
    <BottomSheet open={show} onClose={dismiss} aria-label={isTh ? "ดาวน์โหลดแอป" : "Download app"}>
      <div style={{ padding: "8px 24px 28px", textAlign: "center" }}>
        <img
          src="/icons/icon-512.png"
          alt="Dailymood"
          width={88}
          height={88}
          style={{ width: 88, height: 88, borderRadius: 20, margin: "4px auto 16px", display: "block" }}
        />
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
          {isTh ? "Dailymood มีแอปบน iOS แล้ว" : "Dailymood is now on iOS"}
        </div>
        <div style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 24 }}>
          {isTh
            ? "ดาวน์โหลดแอปเพื่อใช้งานสะดวกและรวดเร็วกว่าเดิม"
            : "Download the app for a faster, smoother experience"}
        </div>

        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onDownload}
          style={{ display: "inline-block", lineHeight: 0 }}
          aria-label={isTh ? "ดาวน์โหลดทาง App Store" : "Download on the App Store"}
        >
          <img
            src={`${R2}/guide/app-store-badge-${isTh ? "th" : "en"}.svg`}
            alt={isTh ? "ดาวน์โหลดทาง App Store" : "Download on the App Store"}
            height={52}
            style={{ height: 52, width: "auto", display: "block" }}
          />
        </a>

        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            onClick={dismiss}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-3)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: 4,
            }}
          >
            {isTh ? "ไว้ทีหลัง" : "Maybe later"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
