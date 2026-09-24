import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-text"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-on-primary shadow-card">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path d="M5 16l4.5-4.5 3 3L19 8" />
        </svg>
      </span>
      DevLog
    </Link>
  );
}
