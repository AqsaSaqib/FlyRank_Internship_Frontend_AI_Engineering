"use client";

import { useId, useState, type ReactNode } from "react";

// APG Disclosure pattern: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
// A native <button> already works with Enter and Space, so no key handling is needed.

type DisclosureProps = {
  title: string;
  children: ReactNode;
};

export default function Disclosure({ title, children }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="rounded-lg border border-slate-200">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {title}
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      <div id={contentId} hidden={!isOpen} className="px-4 pb-4 text-slate-600">
        {children}
      </div>
    </div>
  );
}
