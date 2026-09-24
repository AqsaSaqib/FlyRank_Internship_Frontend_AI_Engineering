export type NavItem = {
  href: string;
  label: string;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs", label: "Logs" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
  { href: "/health", label: "Health" },
];

/**
 * A route is active when the pathname matches exactly, or when it is a
 * nested route of the link (e.g. /logs/new keeps "Logs" highlighted).
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
