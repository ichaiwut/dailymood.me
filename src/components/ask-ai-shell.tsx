"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import type { Tier } from "@/lib/tier";
import type { AskAiSource } from "@/db/schema";
import { AiSubTabs } from "./ai-sub-tabs";

interface Thread {
  id: string;
  title: string;
  lastMessageAt: string;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  sourcesJson?: AskAiSource[] | null;
  feedback?: string | null;
  entriesUsed?: number;
  createdAt: string;
}

export function AskAiShell({ tier = "free" }: { tier?: Tier }) {
  const locale = useLocale();
  const isPremium = tier === "premium";

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPremium) return;
    fetch("/api/ask-ai/threads").then((r) => r.ok ? r.json() : { threads: [] }).then((d) => {
      setThreads((d as { threads: Thread[] }).threads ?? []);
    }).catch(() => {});
    fetch(`/api/ask-ai/suggested?locale=${locale}`).then((r) => r.ok ? r.json() : null).then((d) => {
      const data = d as Record<string, unknown> | null;
      if (data?.questions) setSuggested(data.questions as string[]);
    }).catch(() => {});
  }, [isPremium, locale]);

  useEffect(() => {
    if (!activeThreadId) { setMessages([]); return; }
    fetch(`/api/ask-ai/messages?threadId=${activeThreadId}`).then((r) => r.ok ? r.json() : { messages: [] }).then((d) => {
      setMessages((d as { messages: Message[] }).messages ?? []);
    }).catch(() => {});
  }, [activeThreadId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createThread = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/ask-ai/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const data = (await res.json()) as { id: string; title: string };
    setThreads((prev) => [{ id: data.id, title: data.title, lastMessageAt: new Date().toISOString() }, ...prev]);
    setActiveThreadId(data.id);
    setMessages([]);
    return data.id;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);

    let threadId = activeThreadId;
    if (!threadId) {
      threadId = await createThread();
    }

    setMessages((prev) => [...prev, { id: "temp-user", role: "user", content: text.trim(), createdAt: new Date().toISOString() }]);
    setInput("");

    try {
      const res = await fetch("/api/ask-ai/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, content: text.trim(), locale }),
      });
      const data = (await res.json()) as { userMessage: Message; aiMessage: Message };
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "temp-user"),
        data.userMessage,
        data.aiMessage,
      ]);
      setThreads((prev) =>
        prev.map((t) => t.id === threadId ? { ...t, title: text.trim().slice(0, 60), lastMessageAt: new Date().toISOString() } : t)
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== "temp-user"));
    } finally {
      setSending(false);
    }
  }, [activeThreadId, sending, locale, createThread]);

  const handleFeedback = useCallback(async (messageId: string, feedback: "up" | "down") => {
    if (feedbackSent.has(messageId)) return;
    setFeedbackSent((prev) => new Set(prev).add(messageId));
    await fetch("/api/ask-ai/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, feedback }),
    }).catch(() => {});
  }, [feedbackSent]);

  const deleteThread = useCallback(async (id: string) => {
    await fetch(`/api/ask-ai/threads?id=${id}`, { method: "DELETE" }).catch(() => {});
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) { setActiveThreadId(null); setMessages([]); }
  }, [activeThreadId]);

  if (!isPremium) {
    return (
      <div className="text-center py-16 fade-in">
        <div style={{ fontSize: 48, marginBottom: 14 }}>✨</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
          {locale === "th" ? "Ask AI เป็นฟีเจอร์ Premium" : "Ask AI is a Premium feature"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 20 }}>
          {locale === "th" ? "ถามอะไรก็ได้เกี่ยวกับอารมณ์ของคุณ AI จะวิเคราะห์จากข้อมูลจริง" : "Ask anything about your mood — AI analyzes your real data"}
        </p>
        <a href="/pricing" style={{
          display: "inline-block", padding: "14px 28px", borderRadius: 20,
          background: "var(--ink)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none",
        }}>
          {locale === "th" ? "อัปเกรด →" : "Upgrade →"}
        </a>
      </div>
    );
  }

  const isNewThread = !activeThreadId || messages.length === 0;

  return (
    <div>
      <AiSubTabs active="ask-ai" locale={locale} />
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "calc(100vh - 120px)", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ borderRight: "1.5px solid #F2F0F5", padding: "16px", overflowY: "auto", background: "#FAFAF8" }}>
        <button
          onClick={() => { setActiveThreadId(null); setMessages([]); }}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
            background: "var(--ink)", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer", marginBottom: 20,
          }}
        >
          + {locale === "th" ? "คำถามใหม่" : "New question"}
        </button>

        {threads.length > 0 && (
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)", marginBottom: 10 }}>
            {locale === "th" ? "ก่อนหน้า" : "Previous"}
          </div>
        )}

        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveThreadId(t.id)}
            style={{
              width: "100%", textAlign: "left", padding: "14px 14px",
              borderRadius: 14, border: "none", cursor: "pointer", marginBottom: 4,
              background: activeThreadId === t.id ? "#F0EAFF" : "transparent",
              borderLeft: activeThreadId === t.id ? "3px solid #A673F1" : "3px solid transparent",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.title || (locale === "th" ? "คำถามใหม่" : "New question")}
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 2 }}>
              {timeAgo(t.lastMessageAt, locale)}
            </div>
          </button>
        ))}
      </div>

      {/* Main chat */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {isNewThread ? (
            <EmptyState locale={locale} suggested={suggested} onAsk={sendMessage} />
          ) : (
            <>
              {messages.map((msg) => (
                msg.role === "user" ? (
                  <UserBubble key={msg.id} msg={msg} locale={locale} />
                ) : (
                  <AiBubble key={msg.id} msg={msg} locale={locale} feedbackSent={feedbackSent} onFeedback={handleFeedback} />
                )
              ))}
              {sending && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg, #FCA45B, #A673F1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: "#fff", fontWeight: 700,
                  }}>✦</div>
                  <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
                    {locale === "th" ? "กำลังคิด..." : "Thinking..."}
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div style={{ borderTop: "1.5px solid #F2F0F5", padding: "16px 32px 20px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1.5px solid #F2F0F5", borderRadius: 16, padding: "10px 16px",
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={locale === "th" ? "ถามอะไรก็ได้เกี่ยวกับอารมณ์ของคุณ..." : "Ask anything about your mood..."}
              disabled={sending}
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 15, color: "var(--ink)",
                background: "transparent", fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none",
                background: input.trim() && !sending ? "#FCA45B" : "#F2F0F5",
                color: input.trim() && !sending ? "#fff" : "var(--ink-3)",
                fontSize: 18, fontWeight: 700, cursor: input.trim() && !sending ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ↑
            </button>
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)", textAlign: "center", marginTop: 8 }}>
            {locale === "th" ? "AI อ่านได้แค่ข้อมูลของคุณ · ไม่ใช่คำแนะนำทางการแพทย์" : "AI reads only your data · Not medical advice"}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

/* ── Empty State ── */

function EmptyState({ locale, suggested, onAsk }: { locale: string; suggested: string[]; onAsk: (q: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "linear-gradient(135deg, #FCA45B, #A673F1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, color: "#fff", marginBottom: 16,
      }}>✦</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
        {locale === "th" ? "ถามอะไรก็ได้เกี่ยวกับคุณ" : "Ask anything about you"}
      </h2>
      <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 28, maxWidth: 400 }}>
        {locale === "th" ? "AI อ่าน entries ของคุณแล้ววิเคราะห์ให้ พร้อมอ้างอิงข้อมูลจริง" : "AI reads your entries and analyzes them with real data references"}
      </p>

      {suggested.length > 0 && (
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10, textAlign: "left" }}>
            💡 {locale === "th" ? "คำถามแนะนำสำหรับคุณ" : "Suggested for you"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suggested.map((q, i) => (
              <button
                key={i}
                onClick={() => onAsk(q)}
                style={{
                  textAlign: "left", padding: "14px 16px", borderRadius: 14,
                  border: "1.5px solid #F2F0F5", background: "#fff", cursor: "pointer",
                  fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FAF7FE"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Message Bubbles ── */

function UserBubble({ msg, locale }: { msg: Message; locale: string }) {
  const time = new Date(msg.createdAt).toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
      <div style={{ maxWidth: "70%" }}>
        <div style={{ fontSize: 14, color: "var(--ink-3)", textAlign: "right", marginBottom: 4 }}>
          {locale === "th" ? "คุณเอง" : "You"} · {time}
        </div>
        <div style={{
          background: "#F8F6FB", borderRadius: 16, padding: "14px 18px",
          fontSize: 15, color: "var(--ink)", lineHeight: 1.5,
        }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function AiBubble({ msg, locale, feedbackSent, onFeedback }: {
  msg: Message; locale: string; feedbackSent: Set<string>; onFeedback: (id: string, fb: "up" | "down") => void;
}) {
  const sources = msg.sourcesJson ?? [];
  const entriesUsed = (msg as Message & { entriesUsed?: number }).entriesUsed ?? sources.length;

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #FCA45B, #A673F1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, color: "#fff", fontWeight: 700,
      }}>✦</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 6, letterSpacing: 0.3 }}>
          DAILYMOOD AI · {locale === "th" ? "ดู" : "read"} {entriesUsed} ENTRIES
        </div>
        <div
          style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.65, marginBottom: 14 }}
          dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
        />

        {/* Feedback */}
        <div className="flex items-center gap-2">
          <FbBtn
            label={`👍 ${locale === "th" ? "มีประโยชน์" : "Helpful"}`}
            active={feedbackSent.has(msg.id) || msg.feedback === "up"}
            onClick={() => onFeedback(msg.id, "up")}
          />
          <FbBtn
            label={`👎 ${locale === "th" ? "ไม่ตรง" : "Not relevant"}`}
            active={feedbackSent.has(msg.id) || msg.feedback === "down"}
            onClick={() => onFeedback(msg.id, "down")}
          />
          <button
            onClick={() => { navigator.clipboard.writeText(msg.content); }}
            style={{
              background: "none", border: "1.5px solid #F2F0F5", borderRadius: 20,
              padding: "6px 14px", fontSize: 14, fontWeight: 600, color: "var(--ink-2)",
              cursor: "pointer",
            }}
          >
            📋 {locale === "th" ? "คัดลอก" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FbBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      style={{
        background: active ? "#F0EAFF" : "#fff",
        color: active ? "#A673F1" : "var(--ink-2)",
        border: `1.5px solid ${active ? "#A673F1" : "#F2F0F5"}`,
        borderRadius: 20, padding: "6px 14px", fontSize: 14, fontWeight: 600,
        cursor: active ? "default" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

/* ── Helpers ── */

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "th" ? "เมื่อกี้" : "just now";
  if (mins < 60) return locale === "th" ? `${mins} นาทีก่อน` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return locale === "th" ? `${hrs} ชั่วโมงก่อน` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return locale === "th" ? "เมื่อวาน" : "yesterday";
  if (days < 7) return locale === "th" ? `${days} วันก่อน` : `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return locale === "th" ? `${weeks} สัปดาห์ก่อน` : `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return locale === "th" ? `${months} เดือนก่อน` : `${months}mo ago`;
}
