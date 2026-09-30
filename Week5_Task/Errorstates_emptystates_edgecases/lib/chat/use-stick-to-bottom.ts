"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How close to the bottom (px) still counts as "at the bottom". */
const BOTTOM_THRESHOLD = 48;

/**
 * Auto-scroll that respects the reader.
 *
 * - While pinned, new content (streamed tokens, new messages) keeps the view
 *   at the bottom.
 * - The pin is released the moment the user scrolls up — by wheel, touch,
 *   keyboard or scrollbar — even in the middle of a stream.
 * - It re-engages when the user scrolls back to the bottom or calls
 *   `scrollToBottom()` (the "Jump to latest" button, or sending a message).
 *
 * Growth is detected with a ResizeObserver on the content, so it reacts to
 * every token without the caller having to pass dependencies.
 */
export function useStickToBottom<
  S extends HTMLElement = HTMLDivElement,
  C extends HTMLElement = HTMLDivElement,
>() {
  const scrollRef = useRef<S>(null);
  const contentRef = useRef<C>(null);
  const pinned = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const setPinned = useCallback((value: boolean) => {
    pinned.current = value;
    setIsAtBottom(value);
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      setPinned(true);
      el.scrollTo({ top: el.scrollHeight, behavior });
    },
    [setPinned],
  );

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    let lastTop = el.scrollTop;
    let lastHeight = el.scrollHeight;

    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      // Moving up while the content didn't shrink can only be the user.
      const movedUp = el.scrollTop < lastTop - 1 && el.scrollHeight >= lastHeight;
      if (movedUp && distance > 1) setPinned(false);
      else if (distance <= BOTTOM_THRESHOLD) setPinned(true);
      lastTop = el.scrollTop;
      lastHeight = el.scrollHeight;
    };

    // Release immediately on an upward wheel gesture, before the scroll event,
    // so the next token can't yank the view back down.
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && el.scrollTop > 0) setPinned(false);
    };

    // Same for touch: a finger moving down scrolls the content up.
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (y > touchY + 4 && el.scrollTop > 0) setPinned(false);
      touchY = y;
    };

    const observer = new ResizeObserver(() => {
      if (pinned.current) {
        el.scrollTop = el.scrollHeight; // instant: smooth scrolling lags behind tokens
      } else {
        // Content grew below the fold, so "at bottom" may no longer be true.
        setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD);
      }
      lastTop = el.scrollTop;
      lastHeight = el.scrollHeight;
    });

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    observer.observe(content);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      observer.disconnect();
    };
  }, [setPinned]);

  return { scrollRef, contentRef, isAtBottom, scrollToBottom };
}
