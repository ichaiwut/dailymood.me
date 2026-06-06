"use client";

import { useCallback, useState, type RefObject } from "react";
import { toBlob } from "html-to-image";

/**
 * Shared share-card capture logic — turns a full-res card DOM node into a PNG
 * and exposes Share / Save / Copy actions plus busy + toast state.
 *
 * Mirrors the proven flow from `share-card-modal.tsx` (Web Share API → clipboard
 * → download fallbacks, double-pass capture for Safari font readiness) so any
 * share modal can reuse it without copy-pasting the handlers.
 */
export function useCardShare({
  cardRef,
  width,
  height,
  fileName,
  shareText,
  shareUrl,
  isTh,
  onShared,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  fileName: string;
  shareText: string;
  shareUrl: string;
  isTh: boolean;
  /** Fired once per successful share/save/copy — wire analytics here. */
  onShared?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const node = cardRef.current;
    if (!node) return null;
    const opts = { width, height, pixelRatio: 1, cacheBust: true } as const;
    // First pass can render before the Thai web font is ready (esp. Safari); render twice.
    await toBlob(node, opts);
    return toBlob(node, opts);
  }, [cardRef, width, height]);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await capture();
      if (!blob) throw new Error("no blob");
      onShared?.();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      flash(isTh ? "บันทึกรูปไม่สำเร็จ ลองอีกครั้ง" : "Couldn't save the image — try again");
    } finally {
      setBusy(false);
    }
  }, [capture, fileName, isTh, flash, onShared]);

  const handleShare = useCallback(async () => {
    // No native share sheet (e.g. desktop Firefox) — fall back to saving the image.
    if (typeof navigator === "undefined" || !navigator.share) {
      return handleDownload();
    }
    setBusy(true);
    try {
      const blob = await capture();
      if (!blob) throw new Error("no blob");
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText, url: shareUrl });
      } else {
        await navigator.share({ text: `${shareText} ${shareUrl}`, url: shareUrl });
      }
      onShared?.();
    } catch {
      /* user cancelled or unsupported — no toast needed */
    } finally {
      setBusy(false);
    }
  }, [capture, fileName, shareText, shareUrl, handleDownload, onShared]);

  const handleCopy = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await capture();
      if (!blob) throw new Error("no blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      onShared?.();
      flash(isTh ? "คัดลอกรูปแล้ว" : "Image copied");
    } catch {
      flash(isTh ? "เบราว์เซอร์นี้คัดลอกรูปไม่ได้ ใช้ปุ่มบันทึกแทน" : "Copy unsupported here — use Save instead");
    } finally {
      setBusy(false);
    }
  }, [capture, isTh, flash, onShared]);

  return { busy, toast, handleShare, handleDownload, handleCopy };
}
