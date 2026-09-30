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
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  chart: "M4 20h16M7 16v-5M12 16V6M17 16v-8",
  save: "M6 3h9l4 4v14H5V4a1 1 0 0 1 1-1zM8 3v5h7M8 21v-7h8v7",
  x: "M6 6l12 12M18 6L6 18",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  tag: "M3 12V4h8l10 10-8 8zM7.5 7.5v.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  inbox: "M3 13h5l2 3h4l2-3h5M5 5h14l2 8v6H3v-6z",
  wifiOff:
    "M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 5.2-2.8M19 12.6a10 10 0 0 0-2.3-1.6M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M12 20h.01",
  pen: "M4 20h4L20 8l-4-4L4 16zM14 6l4 4",
  book: "M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h14",
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
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
