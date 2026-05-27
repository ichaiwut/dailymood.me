"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { BottomSheet } from "./bottom-sheet";

const LS_KEY = "pwa-install-dismissed";
const R2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

interface Slide {
  id: string;
  src: string;
  th: string;
  en: string;
}

const ANDROID_SLIDES: Slide[] = [
  { id: "and-1", src: `${R2}/guide/step-1.webp`, th: "กดเมนู ⋮ แล้วเลื่อนหา \"เพิ่มลงในหน้าจอหลัก\"", en: "Tap ⋮ menu, then find \"Add to Home screen\"" },
  { id: "and-2", src: `${R2}/guide/step-2.webp`, th: "กด \"ติดตั้ง\" เพื่อเพิ่มลงหน้าจอ", en: "Tap \"Install\" to add to your home screen" },
  { id: "and-3", src: `${R2}/guide/step-3.webp`, th: "เปิดใช้งานได้เลย เหมือนแอปจริง!", en: "Open it anytime — just like a real app!" },
];

const IOS_SLIDES: Slide[] = [
  { id: "ios-1", src: `${R2}/guide/ios-step-1.webp`, th: "กดปุ่มแชร์ ด้านล่างของหน้าจอ", en: "Tap the Share button at the bottom" },
  { id: "ios-2", src: `${R2}/guide/ios-step-2.webp`, th: "เลื่อนขึ้นในเมนูที่โผล่มา", en: "Scroll up in the menu that appears" },
  { id: "ios-3", src: `${R2}/guide/ios-step-3.webp`, th: "กด \"เพิ่มไปยังหน้าจอโฮม\"", en: "Tap \"Add to Home Screen\"" },
  { id: "ios-4", src: `${R2}/guide/ios-step-4.webp`, th: "กด \"เพิ่ม\" ตรงมุมขวาบน", en: "Tap \"Add\" in the top right" },
  { id: "ios-5", src: `${R2}/guide/ios-step-5.webp`, th: "เปิดใช้งานได้เลย เหมือนแอปจริง!", en: "Open it anytime — just like a real app!" },
];

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

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
  const [idx, setIdx] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  useEffect(() => {
    try {
      if (!isMobile()) return;
      if (isStandalone()) return;
      if (localStorage.getItem(LS_KEY)) return;
      setIsIOS(detectIOS());
      setShow(true);
    } catch {}
  }, []);

  const SLIDES = isIOS ? IOS_SLIDES : ANDROID_SLIDES;

  function dismiss() {
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    setShow(false);
  }

  function goTo(i: number) {
    setIdx(Math.max(0, Math.min(SLIDES.length - 1, i)));
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));
  }

  return (
    <BottomSheet open={show} onClose={dismiss} aria-label={isTh ? "ติดตั้งแอป" : "Install app"}>
      <div style={{ padding: "8px 0 28px", textAlign: "center" }}>
        <div style={{ padding: "0 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
            {isTh ? "เพิ่ม Dailymood ลงหน้าจอหลัก" : "Add Dailymood to Home Screen"}
          </div>
          <div style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5 }}>
            {isTh
              ? "เปิดใช้งานได้เร็วเหมือนแอป ไม่ต้องเปิดเบราว์เซอร์"
              : "Open it quickly like an app — no browser needed"}
          </div>
        </div>

        {/* Step indicator */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          marginBottom: 12,
          fontSize: 14,
          fontWeight: 700,
          color: "var(--purple)",
        }}>
          <span>{isTh ? `ขั้นตอนที่ ${idx + 1}` : `Step ${idx + 1}`}</span>
          <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>/ {SLIDES.length}</span>
        </div>

        {/* Carousel */}
        <div
          style={{ overflow: "hidden", position: "relative" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={trackRef}
            style={{
              display: "flex",
              transition: "transform 300ms ease",
              transform: `translateX(-${idx * 100}%)`,
            }}
          >
            {SLIDES.map((s) => (
              <div
                key={s.id}
                style={{
                  minWidth: "100%",
                  padding: "0 24px",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={s.src}
                  alt={isTh ? s.th : s.en}
                  style={{
                    width: "100%",
                    maxHeight: 360,
                    objectFit: "contain",
                    borderRadius: 14,
                  }}
                />
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginTop: 10,
                  lineHeight: 1.5,
                  minHeight: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {isTh ? s.th : s.en}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "12px 0 20px" }}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                borderRadius: 100,
                border: "none",
                background: i === idx
                  ? "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)"
                  : "var(--surface-2, #E8E5E0)",
                cursor: "pointer",
                padding: 0,
                transition: "width 300ms ease, background 300ms ease",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: "0 24px" }}>
          <button
            type="button"
            onClick={idx < SLIDES.length - 1 ? () => goTo(idx + 1) : dismiss}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)",
              fontSize: 15,
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {idx < SLIDES.length - 1
              ? (isTh ? "ถัดไป →" : "Next →")
              : (isTh ? "เข้าใจแล้ว" : "Got it")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
