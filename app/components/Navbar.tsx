"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2"
    >
      <div className="flex items-center rounded-full border border-[var(--app-border)] border-b-4 border-b-[var(--app-accent)] bg-[var(--app-surface)] p-1.5">
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  rounded-full px-4 py-2 text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]"
                      : "text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
                  }
                `}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
