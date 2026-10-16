"use client";

import { useEffect } from "react";

/**
 * Keeps the chat's composer above the on-screen keyboard on iOS Safari.
 *
 * Android Chrome honours `interactive-widget=resizes-content` (see the
 * viewport in app/layout.tsx), so the layout viewport — and 100dvh — shrinks
 * when the keyboard opens. iOS ignores it: the keyboard only shrinks the
 * *visual* viewport, and the page scrolls underneath. This mirrors the
 * visual viewport's height into `--app-height` (read by the `h-app`
 * utility) and undoes the page scroll iOS adds, so the shell always fits
 * exactly the visible area.
 */
export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Only intervene when something (the keyboard) covers part of the layout viewport.
        // (Pinch-zoom also shrinks the visual viewport; leave that alone.)
        const covered = window.innerHeight - vv.height > 1 && Math.abs(vv.scale - 1) < 0.01;
        if (covered) {
          root.style.setProperty("--app-height", `${vv.height}px`);
          if (window.scrollY !== 0) window.scrollTo(0, 0);
        } else {
          root.style.removeProperty("--app-height");
        }
      });
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--app-height");
    };
  }, []);
}
