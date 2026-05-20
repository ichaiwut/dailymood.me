"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface BodySection {
  type: "text" | "numbered";
  sectionIndex: number;
  number?: number;
  title?: string;
  subtitle?: string;
  content: string;
}

const NUMBERED_RE = /^##\s+(\d+)\.\s+(.+?)(?:\s*[(（](.+?)[)）])?\s*$/;

function parseBodySections(body: string): BodySection[] {
  const lines = body.split("\n");
  const sections: BodySection[] = [];
  let sectionIdx = 0;
  let cur: BodySection | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (cur) {
        cur.content = cur.content.trim();
        sections.push(cur);
      }
      sectionIdx++;
      const m = line.match(NUMBERED_RE);
      if (m) {
        cur = {
          type: "numbered",
          sectionIndex: sectionIdx,
          number: parseInt(m[1]),
          title: m[2].trim(),
          subtitle: m[3]?.trim(),
          content: "",
        };
      } else {
        cur = { type: "text", sectionIndex: sectionIdx, content: line + "\n" };
      }
    } else if (line.trim() === "---" && cur?.type === "numbered") {
      cur.content = cur.content.trim();
      sections.push(cur);
      cur = { type: "text", sectionIndex: 0, content: line + "\n" };
    } else {
      if (!cur) cur = { type: "text", sectionIndex: 0, content: "" };
      cur.content += line + "\n";
    }
  }

  if (cur) {
    cur.content = cur.content.trim();
    sections.push(cur);
  }

  return sections;
}

export function ArticleBody({
  body,
  toneColor,
  toneBg,
}: {
  body: string;
  toneColor?: string;
  toneBg?: string;
}) {
  const sections = useMemo(() => parseBodySections(body), [body]);
  const color = toneColor ?? "var(--peach)";
  const bg = toneBg ?? "rgba(252,164,91,.14)";

  return (
    <div className="article-prose">
      {sections.map((s, i) =>
        s.type === "numbered" ? (
          <div
            key={i}
            id={`section-${s.sectionIndex}`}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: 16,
              padding: "22px 24px",
              marginBottom: 14,
              marginTop: i === 0 || sections[i - 1]?.type === "text" ? 8 : 0,
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: bg,
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 18,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {s.number}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    lineHeight: 1.35,
                    color: "var(--ink)",
                    marginBottom: s.subtitle ? 2 : 6,
                  }}
                >
                  {s.title}
                </div>
                {s.subtitle && (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                      color,
                      marginBottom: 8,
                    }}
                  >
                    {s.subtitle}
                  </div>
                )}
                {s.content && (
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink-2)" }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                    >
                      {s.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div key={i} className="article-prose-section">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                h2: ({ children }) => (
                  <h2 id={`section-${s.sectionIndex}`}>{children}</h2>
                ),
              }}
            >
              {s.content}
            </ReactMarkdown>
          </div>
        ),
      )}
    </div>
  );
}
