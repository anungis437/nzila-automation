"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#features", label: "Features" },
  { href: "/#security", label: "Security" },
];

export function SiteNavigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Close on route change */
  useEffect(() => setMobileOpen(false), [pathname]);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /* Close on Escape */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileOpen(false);
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href.replace("/#", "/"));

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 shadow-lg shadow-black/5 backdrop-blur-xl"
          : "bg-navy/0"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-teal to-teal-light shadow-lg shadow-teal/20 transition-shadow group-hover:shadow-teal/40">
            <span className="text-sm font-bold text-white">GM</span>
          </div>
          <span className={`text-xl font-bold transition-colors ${
            scrolled ? "text-navy" : "text-white"
          }`}>
            Global<span className="text-teal">Mobility</span>
            <span className={`ml-1 text-sm font-normal ${
              scrolled ? "text-gray-400" : "text-gray-300"
            }`}>Client</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-gray-600 hover:text-navy"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <motion.span
                  layoutId="cp-nav-indicator"
                  className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-teal"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}

          <Link
            href="/sign-in"
            className={`ml-4 flex items-center gap-2 text-sm font-medium transition-colors ${
              scrolled ? "text-gray-600 hover:text-navy" : "text-gray-300 hover:text-white"
            }`}
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>

          <Link
            href="/sign-in"
            className="btn-press ml-2 rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal/20 transition-all hover:bg-teal-light hover:shadow-teal/40"
          >
            Access My Cases
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className={scrolled ? "h-6 w-6 text-navy" : "h-6 w-6 text-white"} />
          ) : (
            <Menu className={scrolled ? "h-6 w-6 text-navy" : "h-6 w-6 text-white"} />
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-navy shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <span className="text-lg font-bold text-white">
                  Global<span className="text-teal">Mobility</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-teal/10 text-teal"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-white/10 p-6">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl bg-teal py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-teal-light"
                >
                  Access My Cases
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
