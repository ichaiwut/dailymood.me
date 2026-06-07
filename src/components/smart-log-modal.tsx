"use client";

import { useEffect, useState, useRef, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { DEFAULT_MOODS } from "@/lib/default-moods";
import { DEFAULT_MOOD_PACK } from "@/lib/moods";
import { optimizeImage } from "@/lib/client-image";
import { trackMoodLog, trackAiAnalyze, trackVoiceInput } from "@/lib/analytics";
import type { SpecialDay } from "@/db/schema";
import { getStaticPrompt, FALLBACK_PROMPT } from "@/lib/journal-prompts";
import { SLShell } from "./paper/smartlog/sl-shell";
import { SLHeader } from "./paper/smartlog/sl-header";
import { SLInput } from "./paper/smartlog/sl-input";
import { SLAnalyzing } from "./paper/smartlog/sl-analyzing";
import { SLResult } from "./paper/smartlog/sl-result";
import { SLRateLimit } from "./paper/smartlog/sl-rate-limit";
import type { AiSuggestion, MoodItem, RateLimitInfo, Tier } from "./paper/smartlog/types";

interface Props {
  tier: Tier;
  onClose: () => void;
  onSaved: () => void;
  pack?: string;
  iconFormat?: string;
  preSelectedMoodId?: string;
  presetDate?: string;
  customMoods?: MoodItem[];
}

const KNOWN_ERR_KEYS = new Set(["rate_limited", "premium_required", "image_too_large", "empty_input", "auth_required"]);

export function SmartLogModal({
  tier,
  onClose,
  onSaved,
  pack = DEFAULT_MOOD_PACK,
  iconFormat = "svg",
  preSelectedMoodId,
  presetDate,
  customMoods: customMoodsProp,
}: Props) {
  const t = useTranslations("smart");
  const locale = useLocale();
  const titleId = useId();
  const [fetchedCustomMoods, setFetchedCustomMoods] = useState<MoodItem[]>([]);
  const customMoods = customMoodsProp ?? fetchedCustomMoods;

  const [modalSpecialDays, setModalSpecialDays] = useState<SpecialDay[]>([]);

  const logDate = useMemo(() => {
    if (presetDate) return new Date(presetDate + "T12:00:00");
    return new Date();
  }, [presetDate]);

  useEffect(() => {
    if (customMoodsProp) return;
    fetch("/api/moods").then((r) => r.ok ? r.json() : { moods: [] }).then((d) => {
      const moods = (d as { moods: (MoodItem & { isDefault: boolean })[] }).moods;
      setFetchedCustomMoods(moods.filter((m) => !m.isDefault));
    });
  }, [customMoodsProp]);

  useEffect(() => {
    const y = logDate.getFullYear();
    const m = logDate.getMonth() + 1;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(logDate.getDate()).padStart(2, "0")}`;
    fetch(`/api/events?year=${y}&month=${m}`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((data) => {
        setModalSpecialDays((data as { events: SpecialDay[] }).events.filter((e) => e.date === dateStr));
      });
  }, [logDate]);

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [moodId, setMoodId] = useState<string>(preSelectedMoodId ?? "neutral");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [activityId, setActivityId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [aiLimit, setAiLimit] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [journalPrompt, setJournalPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const promptCacheRef = useRef<Record<string, string>>({});

  const allMoods: MoodItem[] = useMemo(
    () => [...DEFAULT_MOODS.map((m) => ({ ...m, iconKey: null as string | null })), ...customMoods],
    [customMoods],
  );

  const moodLabel = useMemo(() => {
    const moodObj = allMoods.find((m) => m.id === moodId);
    return moodObj ? (locale === "th" ? (moodObj.labelTh ?? moodObj.label) : moodObj.label) : "";
  }, [moodId, locale, allMoods]);

  useEffect(() => {
    if (tier === "guest") return;

    const key = `${moodId}:${locale}`;
    const cached = promptCacheRef.current[key];
    if (cached) { setJournalPrompt(cached); setPromptLoading(false); return; }

    if (tier === "free") {
      const p = getStaticPrompt(moodId, locale);
      promptCacheRef.current[key] = p;
      setJournalPrompt(p);
      return;
    }

    setJournalPrompt(null);
    setPromptLoading(true);

    const controller = new AbortController();
    fetch(`/api/ai/journal-prompt?moodId=${encodeURIComponent(moodId)}&locale=${locale}&moodLabel=${encodeURIComponent(moodLabel)}`, { signal: controller.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((d: unknown) => {
        if (controller.signal.aborted) return;
        const j = d as { prompt?: string } | null;
        if (j?.prompt) {
          promptCacheRef.current[key] = j.prompt;
          setJournalPrompt(j.prompt);
        } else {
          setJournalPrompt(getStaticPrompt(moodId, locale));
        }
        setPromptLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setJournalPrompt(getStaticPrompt(moodId, locale));
        setPromptLoading(false);
      });
    return () => controller.abort();
  }, [moodId, locale, tier, moodLabel]);

  useEffect(() => {
    if (!analyzing) { setAiStep(0); return; }
    const t1 = setTimeout(() => setAiStep(1), 1000);
    const t2 = setTimeout(() => setAiStep(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [analyzing]);

  useEffect(() => {
    fetch("/api/ai/remaining")
      .then((r) => r.json())
      .then((d: unknown) => {
        const j = d as { remaining?: number; limit?: number; tier?: string };
        if (j.remaining !== undefined && j.limit !== undefined) {
          setAiRemaining(j.remaining);
          setAiLimit(j.limit);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!rateLimitInfo) return;
    setCountdown(rateLimitInfo.retryAfterSec);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [rateLimitInfo]);

  const hasInput = text.trim().length > 0 || !!imageFile;

  function addTag() {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags((p) => [...p, val]);
      setTagInput("");
    }
  }

  async function handleAnalyze() {
    if (!text.trim() && !imageFile) return;
    trackAiAnalyze(imageFile ? "vision" : "nlp");
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append("text", text.trim());
      if (imageFile) {
        const opt = await optimizeImage(imageFile);
        fd.append("image", opt);
      }
      const res = await fetch("/api/log/smart", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          retryAfterSec?: number;
          used?: number;
          limit?: number;
        };
        if (j.error === "rate_limited") {
          setRateLimitInfo({
            used: j.used ?? j.limit ?? 0,
            limit: j.limit ?? 0,
            retryAfterSec: j.retryAfterSec ?? 300,
          });
        } else {
          setError(j.error ?? "error");
        }
        return;
      }
      const s = (await res.json()) as AiSuggestion;
      setSuggestion(s);
      setMoodId(s.suggestedMoodId);
      setTags(s.tags);
      if (s.suggestedActivityId) setActivityId(s.suggestedActivityId);
      if (aiRemaining !== null && aiRemaining > 0) setAiRemaining(aiRemaining - 1);
    } catch (e) {
      console.error("[SmartLog] fetch error:", e);
      setError("error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      let imageKey = suggestion?.imageKey ?? null;
      if (!imageKey && imageFile) {
        const fd = new FormData();
        const opt = await optimizeImage(imageFile);
        fd.append("image", opt);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (upRes.ok) {
          const upData = (await upRes.json()) as { imageKey: string };
          imageKey = upData.imageKey;
        }
      }
      const res = await fetch("/api/log/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moodTypeId: moodId,
          note: text.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          sentiment: suggestion?.sentiment ?? null,
          imageKey,
          aiSummary: suggestion?.aiSummary ?? null,
          aiSource: suggestion?.aiSource ?? "manual",
          activityId: activityId || undefined,
          location: location.trim() || undefined,
          locationLat: locationLat ?? undefined,
          locationLng: locationLng ?? undefined,
          ...(presetDate ? { date: presetDate } : {}),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
        if (j.error === "rate_limited") {
          const min = Math.ceil((j.retryAfterSec ?? 300) / 60);
          setError(locale === "th" ? `ลองใหม่ใน ${min} นาที` : `Try again in ${min} min`);
        } else {
          setError(j.error ?? "error");
        }
        return;
      }
      trackMoodLog(suggestion ? "smart_log" : "quick");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  // Resolve an error code to display text: known i18n keys go through `t`,
  // a bare "error" gets a generic message, anything else is shown verbatim
  // (e.g. the localised "try again in N min" string set in handleSave).
  const errorText = error
    ? KNOWN_ERR_KEYS.has(error)
      ? t(`err.${error}` as never)
      : error === "error"
        ? (locale === "th" ? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" : "Something went wrong. Try again.")
        : error
    : null;

  const placeholder = promptLoading
    ? (locale === "th" ? "✦ กำลังเตรียมคำถามให้..." : "✦ Preparing your prompt...")
    : (journalPrompt ?? (locale === "th" ? FALLBACK_PROMPT.th : FALLBACK_PROMPT.en));

  function resetToInput() {
    setSuggestion(null);
    setTags([]);
    setMoodId(preSelectedMoodId ?? "neutral");
    setActivityId(null);
  }

  return createPortal(
    <SLShell
      onClose={onClose}
      width={rateLimitInfo ? 560 : analyzing ? 580 : 728}
      labelledBy={rateLimitInfo || analyzing ? undefined : titleId}
    >
      {rateLimitInfo ? (
        <SLRateLimit
          locale={locale}
          tier={tier}
          rateLimitInfo={rateLimitInfo}
          countdown={countdown}
          busy={busy}
          onSaveWithoutAI={handleSave}
          onClose={onClose}
        />
      ) : (
        <>
          <SLHeader locale={locale} logDate={logDate} specialDays={modalSpecialDays} onClose={onClose} titleId={titleId} />
          {analyzing ? (
            <SLAnalyzing locale={locale} aiStep={aiStep} />
          ) : suggestion ? (
            <SLResult
              locale={locale}
              allMoods={allMoods}
              moodId={moodId}
              onMoodChange={setMoodId}
              text={text}
              tags={tags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              onTagAdd={addTag}
              onTagRemove={(i) => setTags((p) => p.filter((_, j) => j !== i))}
              activityId={activityId}
              onActivityChange={setActivityId}
              suggestion={suggestion}
              pack={pack}
              iconFormat={iconFormat}
              busy={busy}
              onSave={handleSave}
              onWriteMyself={resetToInput}
              onCancel={onClose}
            />
          ) : (
            <SLInput
              locale={locale}
              tier={tier}
              allMoods={allMoods}
              moodId={moodId}
              onMoodChange={setMoodId}
              text={text}
              onTextChange={setText}
              placeholder={placeholder}
              imagePreview={imagePreview}
              onImageSelect={(f) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}
              onImageClear={() => { setImageFile(null); setImagePreview(null); }}
              location={location}
              showLocationSearch={showLocationSearch}
              onLocationToggle={() => setShowLocationSearch((s) => !s)}
              onLocationSelect={(v, lat, lng) => { setLocation(v); setLocationLat(lat); setLocationLng(lng); setShowLocationSearch(false); }}
              onLocationClear={() => setLocation("")}
              activityId={activityId}
              onActivityChange={setActivityId}
              aiRemaining={aiRemaining}
              aiLimit={aiLimit}
              hasInput={hasInput}
              errorText={errorText}
              pack={pack}
              iconFormat={iconFormat}
              busy={busy}
              onVoiceTranscript={(s) => { trackVoiceInput(); setText((p) => (p ? p + " " : "") + s); }}
              onAnalyze={handleAnalyze}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}
        </>
      )}
    </SLShell>,
    document.body,
  );
}
