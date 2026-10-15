import { useEffect, useState } from "react";

export interface Capabilities {
  webgl: boolean;
  reducedMotion: boolean;
  /** Data saver, low memory or very few cores: don't auto-start WebGL. */
  constrained: boolean;
  reason: string | null;
}

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function detect(): Capabilities {
  const nav = navigator as NavigatorHints;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = nav.connection?.saveData === true;
  const slowNet = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
  const fewCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2;
  const webgl = hasWebGL();

  let reason: string | null = null;
  if (!webgl) reason = "WebGL isn't available in this browser.";
  else if (reducedMotion) reason = "You prefer reduced motion, so we're showing a still image.";
  else if (saveData || slowNet) reason = "Data saver / slow connection detected — the 3D bundle is opt-in.";
  else if (lowMemory || fewCores) reason = "This looks like a low-power device — the 3D view is opt-in.";

  return { webgl, reducedMotion, constrained: saveData || slowNet || lowMemory || fewCores, reason };
}

export function useCapabilities(): Capabilities {
  const [caps, setCaps] = useState<Capabilities>(detect);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setCaps(detect());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return caps;
}

/** True while the element is on screen and the tab is visible. */
export function useActive(el: HTMLElement | null): boolean {
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");

  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return inView && visible;
}
