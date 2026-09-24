import Button from "@/components/Button";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/MobileMenu";
import NavLink from "@/components/NavLink";
import ThemeToggle from "@/components/ThemeToggle";
import { navItems } from "@/lib/nav";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-lg">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-border bg-surface/70 p-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  className="block rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
                  activeClassName="bg-primary text-on-primary shadow-card"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden lg:block">
            <Button href="/login" size="sm" variant="ghost">
              Log in
            </Button>
          </span>
          <span className="hidden md:block">
            <Button href="/login" size="sm">
              Get started
            </Button>
          </span>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
