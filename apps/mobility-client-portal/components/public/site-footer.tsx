"use client";

import Link from "next/link";
import { ArrowRight, Linkedin, Twitter, Github, Mail, Globe, ShieldCheck } from "lucide-react";

const NZILA_URL = process.env.NEXT_PUBLIC_NZILA_URL ?? "https://nzilaventures.com";
const ADVISOR_URL = process.env.NEXT_PUBLIC_ADVISOR_URL ?? "https://mobility.nzilaventures.com";
const CONSOLE_URL = process.env.NEXT_PUBLIC_CONSOLE_URL ?? "https://console.nzilaventures.com";

const footerLinks = {
  Portal: [
    { name: "My Cases", href: "/my-cases" },
    { name: "Documents", href: "/documents" },
    { name: "Family Members", href: "/family" },
    { name: "Messages", href: "/messages" },
  ],
  Support: [
    { name: "Help Center", href: "/help" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact Us", href: "/contact" },
    { name: "Accessibility", href: "/accessibility" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/legal/privacy" },
    { name: "Terms of Service", href: "/legal/terms" },
    { name: "GDPR Compliance", href: "/legal/privacy" },
    { name: "Security", href: "/legal/security" },
  ],
};

const ecosystemLinks = [
  { name: "Nzila Ventures", href: NZILA_URL, desc: "Parent company" },
  { name: "Advisor Platform", href: ADVISOR_URL, desc: "For advisors" },
  { name: "Console", href: CONSOLE_URL, desc: "Admin portal" },
];

const socials = [
  { name: "LinkedIn", href: "https://linkedin.com/company/nzila-ventures", icon: Linkedin },
  { name: "X (Twitter)", href: "https://x.com/nzilaventures", icon: Twitter },
  { name: "GitHub", href: "https://github.com/nzila-ventures", icon: Github },
  { name: "Email", href: "mailto:support@nzilaventures.com", icon: Mail },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy text-gray-300">
      {/* ─── Pre-footer CTA ─── */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:px-8">
          <div className="max-w-xl text-center lg:text-left">
            <h3 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              Ready to check on your application?
            </h3>
            <p className="text-lg text-gray-400">
              Sign in to see your latest case updates, upload documents, and
              message your advisor.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className="btn-press inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal/25 transition-all hover:bg-teal-light"
            >
              Access My Cases <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-up"
              className="btn-press inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/20"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Footer ─── */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand Column (spans 2) */}
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-teal to-teal-light shadow-lg shadow-teal/20 transition-shadow group-hover:shadow-teal/40">
                <span className="text-sm font-bold text-white">GM</span>
              </div>
              <span className="text-2xl font-bold text-white">
                Global<span className="text-teal-light">Mobility</span>
                <span className="ml-1 text-sm font-normal text-gray-400">Client</span>
              </span>
            </Link>

            <p className="max-w-sm leading-relaxed text-gray-400">
              Your secure portal for tracking immigration cases, uploading
              documents, and communicating with your advisor — all with
              bank-grade encryption.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald/20 px-3 py-1.5 text-xs font-semibold text-emerald">
                <ShieldCheck className="mr-1.5 h-3 w-3" />
                AES-256
              </span>
              <span className="inline-flex items-center rounded-full bg-teal/20 px-3 py-1.5 text-xs font-semibold text-teal">
                GDPR
              </span>
              <span className="inline-flex items-center rounded-full bg-violet/20 px-3 py-1.5 text-xs font-semibold text-violet">
                SOC 2
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition-all hover:bg-white/15 hover:text-white"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm leading-relaxed text-gray-400 transition-colors hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Ecosystem row */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h4 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white">
            <Globe className="h-3.5 w-3.5 text-gray-500" />
            Nzila Ecosystem
          </h4>
          <div className="flex flex-wrap gap-6">
            {ecosystemLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-sm"
              >
                <span className="inline-flex items-center gap-1 text-gray-400 transition-colors group-hover:text-white">
                  {link.name}
                  <span className="text-xs text-gray-600">↗</span>
                </span>
                <span className="mt-0.5 block text-xs text-gray-600">
                  {link.desc}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Global Mobility OS. All rights
            reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <span>
              A{" "}
              <a
                href={NZILA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-400 transition-colors hover:text-white"
              >
                Nzila Ventures
              </a>{" "}
              product
            </span>
            <span className="text-gray-700">·</span>
            <Link
              href="/legal/privacy"
              className="transition-colors hover:text-gray-300"
            >
              Privacy
            </Link>
            <span className="text-gray-700">·</span>
            <Link
              href="/legal/terms"
              className="transition-colors hover:text-gray-300"
            >
              Terms
            </Link>
            <span className="text-gray-700">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
              </span>
              Secure &amp; Encrypted
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
