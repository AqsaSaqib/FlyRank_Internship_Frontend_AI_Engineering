"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isActivePath } from "@/lib/nav";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  onClick?: () => void;
};

// Client component only because active highlighting needs usePathname().
export default function NavLink({
  href,
  children,
  className = "",
  activeClassName = "bg-primary-soft text-primary",
  inactiveClassName = "text-muted hover:bg-surface-muted hover:text-text",
  onClick,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : inactiveClassName}`}
    >
      {children}
    </Link>
  );
}
