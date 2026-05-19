"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { trackLocationSet } from "@/lib/analytics";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/* eslint-disable @typescript-eslint/no-explicit-any */
let mapsReady = false;
let mapsPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (!mapsPromise) {
    setOptions({ key: apiKey });
    mapsPromise = importLibrary("places")
      .then(() => { mapsReady = true; })
      .catch((err) => { mapsPromise = null; throw err; });
  }
  return mapsPromise;
}

interface LocationSearchProps {
  onSelect: (name: string, lat?: number, lng?: number) => void;
  onClose: () => void;
  locale: string;
}

export function LocationSearch({ onSelect, onClose, locale }: LocationSearchProps) {
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const [hintPlaceId, setHintPlaceId] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const th = locale === "th";

  useEffect(() => { if (apiKey) loadMaps().catch(() => {}); }, []);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function fetchHint(input: string) {
    if (!mapsReady || !input.trim()) { setHint(""); return; }
    const g = (window as any).google;
    const AcSuggestion = g?.maps?.places?.AutocompleteSuggestion;
    if (!AcSuggestion) return;
    try {
      const { suggestions } = await AcSuggestion.fetchAutocompleteSuggestions({ input });
      const top = suggestions?.[0]?.placePrediction;
      if (top) {
        setHint(top.mainText?.text ?? top.text?.text ?? "");
        setHintPlaceId(top.placeId ?? "");
      } else {
        setHint("");
        setHintPlaceId("");
      }
    } catch { setHint(""); }
  }

  function handleInput(val: string) {
    setText(val);
    setHint("");
    clearTimeout(debounceRef.current);
    if (val.trim()) {
      debounceRef.current = setTimeout(() => fetchHint(val), 300);
    }
  }

  function handleAdd() {
    const val = (hint || text).trim();
    if (!val) return;
    onSelect(val.slice(0, 200));
    trackLocationSet("search");
  }

  return (
    <div ref={wrapRef} style={{ marginTop: 10 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface)", border: "1px solid var(--hairline)",
        borderRadius: 14, padding: "8px 12px",
        position: "relative",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder={th ? "พิมพ์ชื่อสถานที่..." : "Type a place name..."}
          maxLength={200}
          style={{
            flex: 1, minWidth: 0, background: "none", border: "none",
            fontSize: 14, fontWeight: 600, color: "var(--ink)", outline: "none",
          }}
        />
        {(text.trim() || hint) && (
          <button
            type="button"
            onClick={handleAdd}
            style={{
              padding: "4px 12px", borderRadius: 8, background: "var(--ink)",
              border: "none", fontSize: 14, fontWeight: 700, color: "#fff",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {th ? "เพิ่ม" : "Add"}
          </button>
        )}
      </div>
      {hint && (
        <button
          type="button"
          onClick={async () => {
            let lat: number | undefined;
            let lng: number | undefined;
            if (hintPlaceId) {
              try {
                const g = (window as any).google;
                const Place = g?.maps?.places?.Place;
                if (Place) {
                  const place = new Place({ id: hintPlaceId });
                  await place.fetchFields({ fields: ["location"] });
                  lat = place.location?.lat();
                  lng = place.location?.lng();
                }
              } catch {}
            }
            onSelect(hint.slice(0, 200), lat, lng);
            trackLocationSet("search");
          }}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "6px 12px",
            borderRadius: 10, background: "#F4EEFB", border: "none", cursor: "pointer",
            width: "100%", textAlign: "left",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#A673F1" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{hint}</span>
        </button>
      )}
    </div>
  );
}
