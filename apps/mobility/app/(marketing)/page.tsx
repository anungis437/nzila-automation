/**
 * Global Mobility OS — Marketing Landing Page
 * ─────────────────────────────────────────────
 * Premium, Nzila-quality public site with scroll-triggered reveals,
 * rich imagery, animated stats, and consistent section patterns.
 */

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import AnimatedFeatures from "./components/animated-features";
import AnimatedReviews from "./components/animated-reviews";
import AnimatedCTA from "./components/animated-cta";

export const metadata: Metadata = {
  title: "Global Mobility OS — The Operating System for Investment Migration",
  description:
    "End-to-end case management, automated compliance, program intelligence, and AI-powered advisory — purpose-built for firms managing citizenship and residency by investment.",
  openGraph: {
    title: "Global Mobility OS — The Operating System for Investment Migration",
    description:
      "40+ programs, 25+ countries. Case management, compliance, and AI advisory for investment migration firms.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&h=630&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "Aerial view of a modern city skyline — representing global mobility",
      },
    ],
  },
};

const reviews = [
  {
    name: "Elena V.",
    title: "Managing Partner, Atlantic Migration Advisory",
    content:
      "Global Mobility OS replaced three separate systems for us. The program intelligence engine alone saved our team 15 hours per week on eligibility research.",
    rating: 5,
  },
  {
    name: "James H.",
    title: "Compliance Director, Pacific RCBI Group",
    content:
      "The automated KYC/AML screening and audit trails are best-in-class. We passed our last regulatory review with zero findings — a first for us.",
    rating: 5,
  },
  {
    name: "Sophia M.",
    title: "Principal, Mediterranean Visa Partners",
    content:
      "The AI Copilot generates client memos and program comparisons in minutes. Our advisors can focus on relationships instead of paperwork.",
    rating: 5,
  },
  {
    name: "David K.",
    title: "Operations Lead, Gulf Residency Solutions",
    content:
      "From intake to government submission, every step is tracked. The client portal reduced our email volume by 60% — clients love the transparency.",
    rating: 5,
  },
  {
    name: "Ana R.",
    title: "Founder, Caribbean CBI Advisors",
    content:
      "We onboarded in four days. The Grenada and St Kitts program templates were ready out of the box — including all government checklists and timelines.",
    rating: 5,
  },
];

const programHighlights = [
  { country: "🇲🇹 Malta", type: "Residency", min: "€150,000", processing: "4–6 months" },
  { country: "🇵🇹 Portugal", type: "Golden Visa", min: "€500,000", processing: "6–8 months" },
  { country: "🇬🇩 Grenada", type: "Citizenship", min: "$150,000", processing: "3–4 months" },
  { country: "🇰🇳 St Kitts", type: "Citizenship", min: "$250,000", processing: "2–3 months" },
  { country: "🇦🇪 UAE", type: "Golden Visa", min: "$545,000", processing: "30 days" },
  { country: "🇬🇷 Greece", type: "Golden Visa", min: "€250,000", processing: "2–3 months" },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden -mt-16 md:-mt-20">
        <Image
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920"
          alt="Aerial view of a modern coastal city skyline — representing global mobility and international migration"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-navy/80 via-navy/70 to-navy/90" />
        <div className="absolute inset-0 bg-mesh opacity-60" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <ScrollReveal>
            <span className="mb-6 inline-block rounded-full bg-amber/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-light">
              Built for Investment Migration Firms
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
              The Operating System for
              <br />
              <span className="gradient-text">Global Mobility</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mb-10 max-w-3xl text-xl text-gray-300 md:text-2xl">
              End-to-end case management, automated compliance, and AI-powered
              advisory — purpose-built for citizenship &amp; residency by
              investment.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="btn-press inline-flex items-center justify-center rounded-xl bg-amber px-8 py-4 text-lg font-bold text-white shadow-lg shadow-amber/30 transition-all hover:bg-amber-light"
              >
                Start Free Pilot
              </Link>
              <Link
                href="#features"
                className="btn-press inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur transition-all hover:bg-white/20"
              >
                See Features
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1.5">
            <div className="h-3 w-1.5 animate-bounce rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS BAR ═══════════════════════ */}
      <section className="relative overflow-hidden bg-navy-light py-16">
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "40+", label: "Programs Covered" },
              { value: "25+", label: "Countries" },
              { value: "3×", label: "Faster Processing" },
              { value: "99.8%", label: "Compliance Rate" },
            ].map((stat) => (
              <ScrollReveal key={stat.label}>
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-white md:text-5xl">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section id="features" className="bg-white px-4 py-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <AnimatedFeatures />
        </div>
      </section>

      {/* ═══════════════════════ MISSION ═══════════════════════ */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <ScrollReveal direction="left">
              <span className="mb-4 inline-block rounded-full bg-amber/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber">
                Our Mission
              </span>
              <h2 className="mb-6 text-3xl font-bold text-navy md:text-5xl">
                Built by Migration Professionals,{" "}
                <span className="text-amber">for Migration Professionals</span>
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                Unlike generic CRM tools, Global Mobility OS understands the
                unique workflows of investment migration — from dual
                citizenship eligibility to government application timelines.
                We built this platform because every advisor deserves
                purpose-built tools, not spreadsheet workarounds.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Compliance-First",
                  "Multi-Jurisdiction",
                  "Family Unit Tracking",
                  "AI with Human-in-Loop",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber" />
                    <span className="text-sm font-medium text-gray-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800"
                  alt="Professional advisory team working on client cases — representing Global Mobility OS users"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy/40 to-transparent" />
                <div className="glass-card absolute bottom-6 left-6 right-6 rounded-xl p-4">
                  <div className="flex items-center gap-6 text-white">
                    <div>
                      <div className="text-2xl font-bold">40+</div>
                      <div className="text-xs text-gray-300">Programs</div>
                    </div>
                    <div className="h-10 w-px bg-white/20" />
                    <div>
                      <div className="text-2xl font-bold">25+</div>
                      <div className="text-xs text-gray-300">Countries</div>
                    </div>
                    <div className="h-10 w-px bg-white/20" />
                    <div>
                      <div className="text-2xl font-bold">GDPR</div>
                      <div className="text-xs text-gray-300">Compliant</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PROGRAMS ═══════════════════════ */}
      <section id="programs" className="bg-navy py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center">
              <span className="rounded-full bg-gold/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
                Program Intelligence
              </span>
              <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                Program Coverage
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-400">
                Live data on 40+ investment migration programs across 25+
                countries — with eligibility scoring and side-by-side comparison.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programHighlights.map((program, i) => (
              <ScrollReveal key={program.country} delay={i * 0.08}>
                <div className="glass-card rounded-xl p-6 transition-all hover:border-gold/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {program.country}
                    </h3>
                    <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-medium text-gold">
                      {program.type}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-6 text-sm text-gray-400">
                    <div>
                      <p className="text-xs text-gray-500">Min. investment</p>
                      <p className="font-semibold text-white">{program.min}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Processing</p>
                      <p className="font-semibold text-white">
                        {program.processing}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ REVIEWS ═══════════════════════ */}
      <section id="testimonials" className="bg-white px-4 py-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <AnimatedReviews reviews={reviews} />
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="relative overflow-hidden bg-navy py-24">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnimatedCTA />
        </div>
      </section>
    </main>
  );
}
