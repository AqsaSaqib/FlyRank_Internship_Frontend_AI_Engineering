"use client";

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";

import { DURATION, motionScale, prefersReducedMotion } from "@/lib/motion";
import type { AsyncStatus } from "@/lib/use-async-action";
import { Icon, Spinner } from "./icons";
import "./motion-button.css";

/** Everything the button says, visibly and to screen readers. */
export type MotionButtonCopy = {
  /** Visible idle label. Also the accessible name when idle. */
  label: string;
  /** Accessible name + announcement while loading, e.g. "Sending…". */
  loading: string;
  /** Accessible name + announcement on success, e.g. "Sent". */
  success: string;
  /** Announcement on failure, e.g. "Failed to send, retry". */
  error: string;
  /** Visible label in the error state. Default "Retry". */
  retry?: string;
  /** Accessible name in the error state. Starts with the visible text, e.g. "Retry sending message". */
  retryName: string;
};

type Props = {
  status: AsyncStatus;
  onClick: () => void;
  icon: ReactNode;
  copy: MotionButtonCopy;
  variant?: "solid" | "soft";
  size?: "md" | "lg";
  /** Uses aria-disabled, so the button stays focusable and keeps its name. */
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

const HEIGHT = { md: 44, lg: 56 } as const;

// Decaying amplitude, so a linear timing still feels like it settles.
const SHAKE: Keyframe[] = [0, -6, 6, -4, 4, -2, 0].map((x) => ({ transform: `translateX(${x}px)` }));

type Layer = "idle" | "loading" | "success" | "error";

/**
 * A button that shows its whole async lifecycle with motion:
 * idle → hover/focus → pressed → loading → success | error → idle.
 *
 * Only transform and opacity animate. The layout box never changes size: an
 * invisible sizer holds the widest label, and the visible pill is three
 * absolutely positioned pieces (two round caps + a middle) that morph into a
 * circle with translateX / scaleX. See motion-button.css for the details.
 */
export function MotionButton({
  status,
  onClick,
  icon,
  copy,
  variant = "solid",
  size = "md",
  disabled = false,
  className,
  ref,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const shakeRef = useRef<HTMLSpanElement>(null);
  const shakeAnimation = useRef<Animation | null>(null);
  useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement, []);

  // Remember which layer is on its way out, so it can slide up while the new
  // one slides in from below.
  const [swap, setSwap] = useState<{ current: AsyncStatus; leaving: AsyncStatus | null }>({
    current: status,
    leaving: null,
  });
  if (swap.current !== status) setSwap({ current: status, leaving: swap.current });

  const height = HEIGHT[size];

  // Measure the widest label once on mount (and again when web fonts finish
  // loading, since that changes text width). The pill caps need this distance
  // to travel to the center. It is written straight to a CSS variable, so it
  // doesn't cause a re-render.
  useLayoutEffect(() => {
    const button = buttonRef.current;
    const sizer = sizerRef.current;
    if (!button || !sizer) return;
    const measure = () =>
      button.style.setProperty("--mb-shift", `${Math.max(0, (sizer.offsetWidth - height) / 2)}px`);
    measure();
    let active = true;
    document.fonts?.ready.then(() => active && measure());
    return () => {
      active = false;
    };
  }, [height]);

  // Shake once on entering the error state. It runs through the Web Animations
  // API (not a CSS class) so it can be cancelled and restarted cleanly.
  useEffect(() => {
    const el = shakeRef.current;
    if (status !== "error" || !el) return;
    shakeAnimation.current?.cancel();
    if (prefersReducedMotion(el)) return;
    shakeAnimation.current = el.animate(SHAKE, {
      duration: DURATION.shake * motionScale(el),
      easing: "linear",
    });
  }, [status]);

  useEffect(() => () => shakeAnimation.current?.cancel(), []);

  const interactive = !disabled && (status === "idle" || status === "error");
  const tone = status === "success" ? "success" : status === "error" ? "danger" : "base";
  const shape = status === "loading" || status === "success" ? "circle" : "pill";
  const retry = copy.retry ?? "Retry";

  const accessibleName = {
    idle: copy.label,
    loading: copy.loading,
    success: copy.success,
    error: copy.retryName,
  }[status];

  const announcement = { idle: "", loading: copy.loading, success: copy.success, error: copy.error }[status];

  const role = (layer: Layer) =>
    layer === status ? "active" : layer === swap.leaving ? "leaving" : "waiting";

  const clearPressed = (e: { currentTarget: HTMLButtonElement }) => {
    delete e.currentTarget.dataset.pressed;
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={className ? `mb ${className}` : "mb"}
        data-variant={variant}
        data-size={size}
        data-status={status}
        data-tone={tone}
        data-shape={shape}
        data-interactive={interactive || undefined}
        aria-label={accessibleName}
        aria-busy={status === "loading"}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (!disabled) onClick();
        }}
        // :active doesn't fire for Enter, so mirror the press for keyboards.
        onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === "Enter" || e.key === " ") e.currentTarget.dataset.pressed = "";
        }}
        onKeyUp={clearPressed}
        onBlur={clearPressed}
      >
        {/* In normal flow but invisible: sizes the button to its widest label, so the layout box never changes. */}
        <span ref={sizerRef} className="mb-sizer" aria-hidden="true">
          <span className="mb-row">
            <span className="mb-icon">{icon}</span>
            {copy.label}
          </span>
          <span className="mb-row">
            <Icon name="retry" className="mb-icon" />
            {retry}
          </span>
        </span>

        {/* Everything visible lives in here. Hover lifts it, press scales it. */}
        <span className="mb-surface" aria-hidden="true">
          <span ref={shakeRef} className="mb-shake">
            <span className="mb-shadow" />
            <Piece className="mb-cap-l" />
            <Piece className="mb-mid" />
            <Piece className="mb-cap-r" />

            <span className="mb-content" data-role={role("idle")}>
              <span className="mb-row">
                <span className="mb-icon">{icon}</span>
                {copy.label}
              </span>
            </span>
            <span className="mb-content" data-role={role("loading")}>
              <Spinner className="mb-spinner" />
            </span>
            <span className="mb-content mb-content-success" data-role={role("success")}>
              <span className="mb-pop">
                <span className="mb-wipe">
                  <span className="mb-wipe-inner">
                    <Icon name="check" strokeWidth={2.5} className="mb-check" />
                  </span>
                </span>
              </span>
            </span>
            <span className="mb-content mb-content-error" data-role={role("error")}>
              <span className="mb-row">
                <Icon name="retry" className="mb-icon" />
                {retry}
              </span>
            </span>

            <span className="mb-ring mb-ring-pill" />
            <span className="mb-ring mb-ring-circle" />
          </span>
        </span>
      </button>

      {/* Screen readers hear each state change; the visual cross-fades are silent. */}
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}

/** One piece of the pill, with a fill per tone stacked on top of each other. */
function Piece({ className }: { className: string }) {
  return (
    <span className={`mb-piece ${className}`}>
      <span className="mb-fill" data-fill="base" />
      <span className="mb-fill" data-fill="success" />
      <span className="mb-fill" data-fill="danger" />
    </span>
  );
}
