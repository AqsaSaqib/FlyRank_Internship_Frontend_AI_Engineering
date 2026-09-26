"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

// APG Tabs pattern (automatic activation):
// https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/

export type Tab = {
  label: string;
  content: ReactNode;
};

type TabsProps = {
  label: string; // accessible name for the tablist
  tabs: Tab[];
};

export default function Tabs({ label, tabs }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const lastIndex = tabs.length - 1;
    let nextIndex: number;

    if (event.key === "ArrowRight") {
      nextIndex = activeIndex === lastIndex ? 0 : activeIndex + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = activeIndex === 0 ? lastIndex : activeIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    } else {
      return; // any other key (like Tab) keeps its normal behaviour
    }

    event.preventDefault(); // stop the page from scrolling
    setActiveIndex(nextIndex); // automatic activation: select the tab...
    tabRefs.current[nextIndex]?.focus(); // ...and move focus to it
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={tab.label}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={isActive}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={handleKeyDown}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                isActive
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          tabIndex={0}
          hidden={index !== activeIndex}
          className="rounded-b-lg p-4 text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
