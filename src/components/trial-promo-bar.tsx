"use client";

import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";

const KEY = "promo-dismissed";

function subscribe(cb: () => void) {
  window.addEventListener(KEY, cb);
  return () => window.removeEventListener(KEY, cb);
}
const getSnapshot = () => sessionStorage.getItem(KEY) === "1";
const getServerSnapshot = () => false;

/** Trial-promo strip shown above the top nav for free users who haven't started
 *  a trial. Dismissible for the browser session (sessionStorage); the server
 *  gates it off entirely once the user is premium or on an active trial.
 *  Reads storage via useSyncExternalStore so it stays SSR/hydration-safe. */
export function TrialPromoBar({ locale }: { locale: string }) {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(KEY, "1");
    window.dispatchEvent(new Event(KEY));
  };

  return (
    <div
      className="thai"
      style={{ background: "linear-gradient(90deg, var(--peach) 0%, #FBA0A0 45%, var(--purple) 100%)", color: "#fff", minHeight: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 14, fontWeight: 700, padding: "8px 44px 8px 16px", position: "relative" }}
    >
      <span>{locale === "th" ? "✨ ลองใช้ Pro ฟรี 14 วัน — ไม่ต้องใช้บัตร" : "✨ Try Pro free for 14 days — no card required"}</span>
      <Link
        href={"/pricing" as "/"}
        style={{ background: "rgba(255,255,255,.92)", color: "#1A1320", borderRadius: 100, padding: "6px 15px", fontWeight: 800, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}
      >
        {locale === "th" ? "เริ่มเลย →" : "Start now →"}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label={locale === "th" ? "ปิด" : "Dismiss"}
        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "rgba(255,255,255,.85)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4 }}
      >
        ×
      </button>
    </div>
  );
}
