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

/** Washi-tape colour cycle for paper-variant tip cards. */
const WASHI = ["mint", "lav", "yellow"] as const;

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
  variant = "default",
}: {
  body: string;
  toneColor?: string;
  toneBg?: string;
  /** "paper" reskins the numbered tip cards as paper folders (washi tape +
   *  chunky number badge). "default" keeps the plain themed card (admin). */
  variant?: "default" | "paper";
}) {
  const sections = useMemo(() => parseBodySections(body), [body]);
  const color = toneColor ?? "var(--peach)";
  const bg = toneBg ?? "rgba(252,164,91,.14)";
  const isPaper = variant === "paper";

  return (
    <div className="article-prose">
      {sections.map((s, i) =>
        s.type === "numbered" ? (
          // Numbered tip card — same semantic shape in both variants; only the
          // wrapper/sizing/tokens differ between the paper reskin and the
          // themed admin preview. Title is a real <h2> for heading navigation.
          <div
            key={i}
            id={`section-${s.sectionIndex}`}
            className={isPaper ? "pa-sheet" : undefined}
            style={
              isPaper
                ? {
                    borderRadius: "4px 16px 16px 16px",
                    padding: "24px 28px 24px 26px",
                    marginBottom: 22,
                    display: "grid",
                    gridTemplateColumns: "60px 1fr",
                    gap: 22,
                    alignItems: "flex-start",
                    transform: `rotate(${(s.number ?? 1) % 2 ? 0.4 : -0.4}deg)`,
                    position: "relative",
                  }
                : {
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 16,
                    padding: "22px 24px",
                    marginBottom: 14,
                    marginTop: i === 0 || sections[i - 1]?.type === "text" ? 8 : 0,
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }
            }
          >
            {isPaper && (
              <span
                className={`pa-washi ${WASHI[((s.number ?? 1) - 1) % WASHI.length]}`}
                style={{ left: 44, width: 72 }}
              />
            )}
            {/* number badge */}
            <div
              style={{
                width: isPaper ? 56 : 44,
                height: isPaper ? 56 : 44,
                borderRadius: 14,
                background: bg,
                color,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontSize: isPaper ? 28 : 18,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {s.number}
            </div>
            {/* title + subtitle + body */}
            <div style={{ flex: isPaper ? undefined : 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: isPaper ? 21 : 17,
                  fontWeight: 800,
                  margin: isPaper ? "0 0 4px" : `0 0 ${s.subtitle ? 2 : 6}px`,
                  letterSpacing: isPaper ? "-0.015em" : undefined,
                  lineHeight: isPaper ? 1.25 : 1.35,
                  color: isPaper ? "var(--w-ink)" : "var(--ink)",
                }}
              >
                {s.title}
              </h2>
              {s.subtitle && (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: isPaper ? 800 : 700,
                    textTransform: "uppercase",
                    letterSpacing: isPaper ? ".06em" : ".04em",
                    color: isPaper ? "var(--w-ink-3)" : color,
                    marginBottom: isPaper ? 12 : 8,
                  }}
                >
                  {s.subtitle}
                </div>
              )}
              {s.content && (
                <div style={{ fontSize: 15, lineHeight: 1.7, color: isPaper ? "var(--w-ink-2)" : "var(--ink-2)" }}>
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
