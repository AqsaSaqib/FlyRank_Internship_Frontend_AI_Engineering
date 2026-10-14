import type { SVGProps } from "react";

/** Small inline icon set (stroke icons, 24px grid, sized by the caller). Same style as the DevLog chat icons. */
const paths = {
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16v4M17 18h4",
  check: "M5 12l5 5L20 7",
  retry: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** Track + arc. Rotated by CSS (or pulsed when motion is reduced). */
export function Spinner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true" width="1em" height="1em" {...props}>
      <circle cx="12" cy="12" r="9" opacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
