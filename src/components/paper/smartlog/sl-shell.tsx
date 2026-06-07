"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Smart Log modal shell — dimmed/blurred backdrop + centered paper sheet with a
 * washi-tape strip. Owns the dialog accessibility that the bare modal lacked:
 * `role="dialog" aria-modal`, Escape-to-close, backdrop-click close, a focus
 * trap, and focus restoration to the trigger on unmount. Carries `.pa-wrap` so
 * the scoped `--w-*` paper tokens resolve even though we portal to <body>.
 */
export function SLShell({
  onClose,
  width = 728,
  labelledBy,
  children,
}: {
  onClose: () => void;
  width?: number;
  labelledBy?: string;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function focusables(): HTMLElement[] {
      if (!sheetRef.current) return [];
      return Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    }

    // Move focus into the dialog.
    const first = focusables()[0];
    (first ?? sheetRef.current)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="sl-backdrop fade-in" onClick={onClose}>
      <div
        ref={sheetRef}
        className="pa-wrap sl-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sl-drag-handle" aria-hidden />
        <span className="pa-washi lav" aria-hidden style={{ width: 128, top: -13 }} />
        <div className="sl-scroll">{children}</div>
      </div>
    </div>
  );
}
