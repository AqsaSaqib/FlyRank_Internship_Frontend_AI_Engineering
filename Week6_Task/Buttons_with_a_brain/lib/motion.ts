/**
 * Motion tokens: the single source of truth for every duration and easing.
 *
 * The same numbers are used in two places:
 *  - CSS: `motionTokensCss` (below) is injected as a <style> tag in the root
 *    layout, so the CSS custom properties are generated from these constants.
 *  - JS: the shake (Web Animations API) and the state-machine timers read them
 *    directly.
 *
 * `--motion-scale` multiplies every duration. It is 1 normally and 5 when the
 * demo's "Slow-mo 5×" toggle is on.
 */

export const DURATION = {
  /** Press down. Has to feel immediate, so it is under the ~100ms "instant" threshold. */
  instant: 90,
  /** Hover lift, focus ring, press release. */
  fast: 160,
  /** Label / icon swaps and color cross-fades. */
  base: 240,
  /** Pill ⇄ circle morph. The biggest visual change, so it gets the most time. */
  morph: 320,
  /** One error shake. */
  shake: 400,
  /** One spinner turn. */
  spin: 800,
} as const;

/** Durations used when motion is reduced: only opacity fades remain, and they are shorter. */
export const REDUCED_DURATION = {
  base: 120,
  pulse: 1200,
} as const;

export const EASING = {
  /** Things entering or responding to input: fast start, soft landing. */
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Morphing between two resting states: gentle start and end. */
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  /** Small overshoot. Only used for the success check. */
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

/** State-machine timings (in ms, before slow-mo scaling). */
export const TIMING = {
  /** How long the success check stays before returning to idle. */
  successHold: 1200,
  /** Fast responses still show the spinner this long, so it never flashes. */
  minLoading: 450,
} as const;

/** Distances and scales. Reduced motion sets all of them to "no movement". */
const AMOUNTS = {
  "--mb-lift": "-1px",
  "--mb-press": "0.97",
  "--mb-slide": "8px",
  "--mb-morph": "1",
  "--mb-ring-from": "0.94",
  "--mb-pop-from": "0.6",
  "--mb-wipe": "-100%",
} as const;

const REDUCED_AMOUNTS: Record<keyof typeof AMOUNTS, string> = {
  "--mb-lift": "0px",
  "--mb-press": "1",
  "--mb-slide": "0px",
  "--mb-morph": "0",
  "--mb-ring-from": "1",
  "--mb-pop-from": "1",
  "--mb-wipe": "0%",
};

const ms = (value: number) => `calc(${value}ms * var(--motion-scale, 1))`;

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([name, value]) => `${name}:${value};`)
    .join("");

const fullMotion = declarations({
  "--dur-instant": ms(DURATION.instant),
  "--dur-fast": ms(DURATION.fast),
  "--dur-base": ms(DURATION.base),
  "--dur-morph": ms(DURATION.morph),
  "--dur-shake": ms(DURATION.shake),
  "--dur-spin": ms(DURATION.spin),
  "--ease-out": EASING.out,
  "--ease-in-out": EASING.inOut,
  "--ease-spring": EASING.spring,
  "--mb-busy-animation": "mb-spin var(--dur-spin) linear infinite",
  ...AMOUNTS,
});

const reducedMotion = declarations({
  "--dur-base": ms(REDUCED_DURATION.base),
  // No overshoot when nothing moves.
  "--ease-spring": EASING.out,
  // The spinner becomes a gentle opacity pulse.
  "--mb-busy-animation": `mb-pulse ${ms(REDUCED_DURATION.pulse)} ease-in-out infinite alternate`,
  ...REDUCED_AMOUNTS,
});

/**
 * The tokens as CSS. They are declared on :root and again on any
 * [data-motion] element, so a wrapper can change --motion-scale (slow-mo) or
 * force reduced motion for everything inside it.
 *
 * Reduced motion applies when the OS asks for it OR the wrapper has
 * data-motion="reduce". The demo toggle can only add reduction, never remove it.
 */
export const motionTokensCss =
  `:root,[data-motion]{${fullMotion}}` +
  `[data-motion="reduce"]{${reducedMotion}}` +
  `@media (prefers-reduced-motion: reduce){:root,[data-motion]{${reducedMotion}}}`;

/** True when motion should be reduced for this element (OS setting or a data-motion="reduce" ancestor). */
export function prefersReducedMotion(el: Element): boolean {
  return (
    el.closest('[data-motion="reduce"]') !== null ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The current --motion-scale for this element (1, or 5 in slow-mo). */
export function motionScale(el: Element): number {
  const value = parseFloat(getComputedStyle(el).getPropertyValue("--motion-scale"));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** Rows for the "Motion notes" table on the demo page. */
export const MOTION_NOTES = [
  { token: "--dur-instant", value: `${DURATION.instant}ms`, easing: "--ease-out", use: "Press down (scale 0.97)", why: "Under ~100ms reads as instant, so the button feels physically attached to your finger." },
  { token: "--dur-fast", value: `${DURATION.fast}ms`, easing: "--ease-out", use: "Hover lift, focus ring, press release", why: "Quick enough not to lag behind the pointer, slow enough that the release is visible." },
  { token: "--dur-base", value: `${DURATION.base}ms`, easing: "--ease-out", use: "Label / icon swaps, color cross-fades", why: "Long enough to read the new label arriving, short enough not to delay the next action." },
  { token: "--dur-morph", value: `${DURATION.morph}ms`, easing: "--ease-in-out", use: "Pill ⇄ circle morph", why: "The biggest change on screen. Both ends are resting states, so it eases in and out." },
  { token: "--ease-spring", value: `${DURATION.base}ms`, easing: "--ease-spring", use: "Success check only", why: "A small overshoot says \"done!\". Used once, so it stays special." },
  { token: "--dur-shake", value: `${DURATION.shake}ms`, easing: "linear (decaying keyframes)", use: "Error shake, runs once", why: "One short shake catches the eye without feeling like the UI is broken." },
  { token: "min loading", value: `${TIMING.minLoading}ms`, easing: "–", use: "Spinner minimum time", why: "A fast response would otherwise flash the spinner for one frame, which reads as a glitch." },
  { token: "success hold", value: `${TIMING.successHold}ms`, easing: "–", use: "Check stays, then idle", why: "Enough time to notice the check, then the button is ready again." },
] as const;
