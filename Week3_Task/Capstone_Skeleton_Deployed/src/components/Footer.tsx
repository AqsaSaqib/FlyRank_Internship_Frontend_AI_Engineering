import Link from "next/link";
import Logo from "@/components/Logo";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/logs", label: "Daily logs" },
      { href: "/reports", label: "Weekly reports" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/settings", label: "Settings" },
      { href: "/health", label: "System status" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-muted">
            A developer progress journal. Turn your commits and daily notes into
            a record of growth you can share.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-sm font-semibold text-text">{column.heading}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          &copy; {year} DevLog. Built with Next.js and Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
