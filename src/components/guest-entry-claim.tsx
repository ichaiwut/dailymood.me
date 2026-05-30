"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

// Bridges the landing-page "try the AI" handoff. The login form parks the guest
// token in a same-origin cookie before the Google round-trip (so it survives the
// OAuth redirects and the new-user /welcome redirect). Once the user is logged in,
// this consumer — mounted app-wide — redeems the token into their first entry and
// shows a brief confirmation.
export const GUEST_TOKEN_COOKIE = "dm_guest_entry";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=; max-age=0; path=/; samesite=lax${secure}`;
}

export function GuestEntryClaim({ loggedIn }: { loggedIn: boolean }) {
  const locale = useLocale();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    const token = readCookie(GUEST_TOKEN_COOKIE);
    if (!token) return;

    let cancelled = false;

    // Returns true once the claim has settled (success, expiry, etc.); false on a
    // 401, which means the freshly-issued session cookie hasn't propagated to the
    // API route yet — that's the only case worth retrying.
    async function attempt(): Promise<boolean> {
      const res = await fetch("/api/guest/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.status === 401) return false;
      deleteCookie(GUEST_TOKEN_COOKIE);
      const data = (await res.json().catch(() => null)) as { ok?: boolean; alreadyClaimed?: boolean } | null;
      if (!cancelled && res.ok && data?.ok && !data.alreadyClaimed) setSaved(true);
      return true;
    }

    (async () => {
      // Initial try plus two short retries to ride out the post-OAuth session race.
      const delays = [0, 1500, 3000];
      for (const d of delays) {
        if (cancelled) return;
        if (d) await new Promise((r) => setTimeout(r, d));
        try {
          if (await attempt()) return;
        } catch {
          return; // network error — keep the cookie; a later page load can retry
        }
      }
      // Still 401 after retries: leave the cookie for a future navigation to retry.
    })();

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 6000);
    return () => clearTimeout(t);
  }, [saved]);

  if (!saved) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 999,
        background: "var(--ink, #1A1320)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 12px 32px -8px rgba(0,0,0,.4)",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span aria-hidden>✨</span>
      <span>
        {locale === "th"
          ? "บันทึกอารมณ์แรกของคุณเรียบร้อยแล้ว"
          : "Saved your first mood — welcome!"}
      </span>
    </div>
  );
}
