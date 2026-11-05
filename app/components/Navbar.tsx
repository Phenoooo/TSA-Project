"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MotionConfig, motion } from "motion/react";

const links = [
  {
    name: "Home",
    href: "/",
    icon: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
      </>
    ),
  },
  {
    name: "Statistics",
    href: "/dashboard",
    icon: (
      <>
        <path d="M4 20V11m5 9V5m5 15v-7m5 7V8" />
      </>
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <motion.nav
        aria-label="Main navigation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="app-sidebar fixed inset-x-0 bottom-0 z-50 border-t border-[var(--app-border)] bg-[var(--app-bg)]/90 backdrop-blur md:inset-y-0 md:right-auto md:w-20 md:border-r md:border-t-0 xl:w-64"
      >
        <div className="mx-auto flex max-w-xl items-center justify-around px-3 py-2 md:h-full md:max-w-none md:flex-col md:items-stretch md:justify-start md:px-3 md:py-6 xl:px-5">
          <motion.div
            className="mb-9 hidden justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-accent-soft)]/75 px-2 py-2 md:flex"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/" aria-label="Misconception home">
              <span className="relative inline-block h-10 w-10 shrink-0 overflow-hidden rounded-lg xl:hidden">
                <Image
                  src="/logo-transparent.webp"
                  alt=""
                  width={58}
                  height={66}
                  className="absolute left-1/2 top-1/2 h-8 w-auto max-w-none -translate-x-1/2 -translate-y-1/2 mix-blend-multiply"
                />
              </span>
              <Image
                src="/misconception-logo-cropped.png"
                alt=""
                width={184}
                height={45}
                className="hidden h-12 w-auto max-w-[190px] shrink-0 object-contain mix-blend-multiply xl:block"
              />
            </Link>
          </motion.div>

          <div className="flex w-full items-center justify-around md:flex-col md:items-stretch md:gap-2">
            {links.map((link, index) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));

              return (
                <motion.div
                  key={link.href}
                  className="w-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    href={link.href}
                    aria-label={link.name}
                    aria-current={active ? "page" : undefined}
                    title={link.name}
                    className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition-colors md:min-w-0 md:flex-row md:justify-center md:gap-0 md:px-0 md:py-3 xl:justify-start xl:gap-4 xl:px-3 ${
                      active
                        ? "bg-[var(--app-accent-soft)] text-[var(--app-accent-ink)]"
                        : "text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      {link.icon}
                    </svg>
                    <span className="md:hidden xl:inline">{link.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-auto hidden border-t border-[var(--app-border)] pt-5 text-xs leading-relaxed text-[var(--app-text-muted)] xl:block">
            Learn from every answer.
            <br />
            Keep building your skills.
          </div>
        </div>
      </motion.nav>
    </MotionConfig>
  );
}
