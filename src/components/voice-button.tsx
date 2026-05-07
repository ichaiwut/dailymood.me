"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
type SRCtor = new () => SpeechRecognition;

interface Props {
  onTranscript: (text: string) => void;
}

function subscribe() {
  return () => {};
}
function getSupported() {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function VoiceButton({ onTranscript }: Props) {
  const locale = useLocale();
  const supported = useSyncExternalStore(subscribe, getSupported, () => false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  function toggle() {
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    if (recording) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = locale === "th" ? "th-TH" : "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript ?? "";
      if (t) onTranscript(t);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Voice input"
      className={`rounded-full p-2 transition ${
        recording ? "bg-red-500 text-white animate-pulse" : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
      }`}
    >
      {recording ? "■" : "🎤"}
    </button>
  );
}
