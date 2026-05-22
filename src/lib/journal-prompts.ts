export interface JournalPrompt {
  th: string;
  en: string;
}

export const DEFAULT_JOURNAL_PROMPTS: Record<string, JournalPrompt> = {
  amazing: {
    th: "วันนี้มีอะไรดีๆ เกิดขึ้นบ้าง...",
    en: "What made today feel so good...",
  },
  happy: {
    th: "อะไรทำให้รู้สึกสงบแบบนี้...",
    en: "What's bringing that calm feeling...",
  },
  neutral: {
    th: "วันนี้เป็นยังไงบ้าง...",
    en: "How's your day going so far...",
  },
  sad: {
    th: "มีอะไรหนักใจอยู่ไหม...",
    en: "Something weighing on you today...",
  },
  angry: {
    th: "อะไรทำให้รู้สึกแบบนี้วันนี้...",
    en: "What stirred this up today...",
  },
  anxious: {
    th: "มีอะไรวนอยู่ในหัวตอนนี้...",
    en: "What's running through your mind...",
  },
  tired: {
    th: "วันนี้เปลืองแรงไปกับอะไรบ้าง...",
    en: "What drained your energy today...",
  },
};

export const FALLBACK_PROMPT: JournalPrompt = {
  th: "วันนี้รู้สึกยังไง พิมพ์เหมือนคุยกับเพื่อน...",
  en: "How are you feeling? Write like you're talking to a friend...",
};

export function getStaticPrompt(moodId: string, locale: string): string {
  const p = DEFAULT_JOURNAL_PROMPTS[moodId] ?? FALLBACK_PROMPT;
  return locale === "th" ? p.th : p.en;
}
