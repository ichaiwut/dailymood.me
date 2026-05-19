"use client";

import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function ArticleBody({ body }: { body: string }) {
  const h2Counter = useRef(0);

  // Reset counter on each render (body change)
  h2Counter.current = 0;

  return (
    <div className="article-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h2: ({ children }) => {
            h2Counter.current += 1;
            return <h2 id={`section-${h2Counter.current}`}>{children}</h2>;
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
