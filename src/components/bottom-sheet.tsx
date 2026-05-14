"use client";

import { useEffect, useRef, useState } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  "aria-label"?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  maxHeight = "85dvh",
  "aria-label": ariaLabel,
}: BottomSheetProps) {
  const [closing, setClosing] = useState(false);
  const fallbackRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function startClose() {
    if (closing) return;
    setClosing(true);
    fallbackRef.current = setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") startClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  if (!open && !closing) return null;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={startClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(10,10,10,0.4)",
          backdropFilter: "blur(4px)",
          animation: closing ? "fadeOut 200ms ease forwards" : "fadeIn 200ms ease forwards",
        }}
      />
      {/* Panel — centered modal on desktop, bottom sheet on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onAnimationEnd={() => {
          if (closing) {
            clearTimeout(fallbackRef.current);
            setClosing(false);
            onClose();
          }
        }}
        style={{
          position: "fixed",
          zIndex: 50,
          background: "var(--surface, #fff)",
          maxHeight,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          /* Desktop: centered modal */
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(480px, calc(100vw - 32px))",
          borderRadius: 24,
          boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
          animation: closing ? "modalOut 200ms ease forwards" : "modalIn 250ms cubic-bezier(0.16,1,0.3,1) forwards",
        }}
      >
        {/* Close button */}
        <button
          onClick={startClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: 10,
            background: "var(--surface-2, #F5F3F0)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 16, color: "var(--ink-3)",
            zIndex: 1,
          }}
        >
          ✕
        </button>
        <div style={{ padding: "8px 0 0" }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes modalIn { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes modalOut { from { opacity: 1; transform: translate(-50%, -50%) scale(1); } to { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } }
      `}</style>
    </>
  );
}
