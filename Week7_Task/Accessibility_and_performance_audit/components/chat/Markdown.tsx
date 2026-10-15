"use client";

import { Streamdown } from "streamdown";

/**
 * Streamdown (markdown, code highlighting, Mermaid) is the heaviest thing on
 * the client, ~470 KB. It lives in its own module so Message can load it
 * lazily: a fresh chat (the welcome screen) never downloads it.
 */
export default function Markdown({ text, animating }: { text: string; animating: boolean }) {
  return (
    <Streamdown
      className="chat-markdown text-[15px] leading-relaxed"
      isAnimating={animating}
      caret={animating ? "circle" : undefined}
      // Links open in a new tab without the confirmation modal.
      linkSafety={{ enabled: false }}
    >
      {text}
    </Streamdown>
  );
}
