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
    }, 350);
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
        className={closing ? "scrim-close" : "scrim-open"}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(10,10,10,0.32)",
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={closing ? "sheet-close" : "sheet-open"}
        onAnimationEnd={() => {
          if (closing) {
            clearTimeout(fallbackRef.current);
            setClosing(false);
            onClose();
          }
        }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderRadius: "28px 28px 0 0",
          background: "var(--surface)",
          maxHeight,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Drag handle */}
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 4px",
          }}
        >
          <div
            style={{
              width: 44,
              height: 5,
              borderRadius: 100,
              background: "#E0DDE3",
            }}
          />
        </div>
        {children}
      </div>
    </>
  );
}
