/**
 * SiteNavigation — Flagship marketing navigation for Global Mobility OS
 * ─────────────────────────────────────────────────────────────────────────
 * Fixed navbar with scroll-aware transparency, Framer Motion active
 * indicator, mobile drawer with body-scroll lock, keyboard esc-close,
 * and auto-close on route change.  Aligned with apps/union-eyes Navigation.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/#features" },
  { name: "Programs", href: "/#programs" },
  { name: "Testimonials", href: "/#testimonials" },
];

export function SiteNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── Scroll-aware glass effect ── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── Close mobile menu on route change ── */
  // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate: sync mobile menu with route
  useEffect(() => { setMobileMenuOpen(false) }, [pathname]);

  /* ── Body scroll lock when mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  /* ── Keyboard: Escape closes mobile menu ── */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileMenuOpen, handleKeyDown]);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 shadow-sm backdrop-blur-xl"
          : "bg-navy/80 backdrop-blur-md"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-amber to-gold shadow-lg shadow-amber/20 transition-shadow group-hover:shadow-amber/40">
                <span className="text-sm font-bold text-white">GM</span>
              </div>
              <span
                className={`text-xl font-bold transition-colors ${
                  scrolled ? "text-navy" : "text-white"
                }`}
              >
                Global<span className={scrolled ? "text-amber" : "text-gold-light"}>Mobility</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 lg:flex">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? scrolled
                        ? "text-amber"
                        : "text-white"
                      : scrolled
                        ? "text-gray-600 hover:text-navy"
                        : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="gm-nav-indicator"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-amber"
                    />
                  )}
                </Link>
              );
            })}

            <div className="h-6 w-px bg-gray-300/30" />

            <Link
              href="/sign-up"
              className="btn-press rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber/25 transition-colors hover:bg-amber-light"
            >
              Get Started
            </Link>

            <Link
              href="/sign-in"
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-gray-600 hover:text-navy"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`rounded-lg p-2 transition-colors ${
                scrolled ? "text-gray-700" : "text-white"
              }`}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />

            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative z-50 border-t border-gray-100 bg-white shadow-2xl lg:hidden"
            >
              <div className="max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto px-4 pb-5 pt-3">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                        isActive
                          ? "bg-amber/10 text-amber"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl bg-amber px-4 py-3 text-center text-base font-semibold text-white shadow-lg shadow-amber/25"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-gray-600 transition-colors hover:text-navy"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
