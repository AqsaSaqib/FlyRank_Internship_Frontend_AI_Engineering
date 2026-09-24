"use client";

import { useEffect, useState } from "react";
import NavLink from "@/components/NavLink";
import { navItems } from "@/lib/nav";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Close the menu with the Escape key while it is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-control text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-0 top-16 border-b border-border bg-surface shadow-lg"
        >
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  onClick={close}
                  className="block rounded-control px-3 py-2.5 text-base font-medium"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 border-t border-border pt-3">
              <NavLink
                href="/login"
                onClick={close}
                className="block rounded-control px-3 py-2.5 text-base font-medium"
              >
                Log in
              </NavLink>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
