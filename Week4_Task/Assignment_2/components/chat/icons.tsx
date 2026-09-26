import type { SVGProps } from "react";

/** Small inline icon set (stroke icons, 24px grid, sized by the caller). */
const paths = {
  send: "M12 19V5M5 12l7-7 7 7",
  stop: "",
  copy: "M8 8h11v11H8zM5 16V5h11",
  check: "M5 12l5 5L20 7",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  plus: "M12 5v14M5 12h14",
  arrowDown: "M12 5v14M5 12l7 7 7-7",
  alert: "M12 8v5M12 16.5v.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  chevron: "M9 6l6 6-6 6",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
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
      {name === "stop" ? (
        <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
      ) : (
        <path d={paths[name]} />
      )}
    </svg>
  );
}
