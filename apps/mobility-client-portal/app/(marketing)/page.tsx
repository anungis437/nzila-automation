/**
 * Global Mobility OS — Client Portal Marketing Landing Page
 * ──────────────────────────────────────────────────────────
 * Premium, Nzila-quality public site with scroll-triggered reveals,
 * rich imagery, animated components, and teal/amber client palette.
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
  title: "Global Mobility OS — Client Portal",
  description:
    "Track your immigration case, upload documents, manage family members, and communicate with your advisor — all in one secure portal.",
  openGraph: {
    title: "Global Mobility OS — Client Portal",
    description:
      "Your immigration journey, in your hands. Secure case tracking, document upload, and advisor messaging.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "Professional reviewing documents — Global Mobility Client Portal",
      },
    ],
  },
};

const reviews = [
  {
    name: "Camila R.",
    title: "Golden Visa Applicant, Portugal",
    content:
      "I could see exactly where my application was at every step. No more anxious emails — the portal told me everything I needed to know.",
    rating: 5,
  },
  {
    name: "Ahmed K.",
    title: "UAE Residency Applicant",
    content:
      "Uploading documents was so simple. I got instant confirmations when my advisor verified each one. The whole experience felt professional.",
    rating: 5,
  },
  {
    name: "Sarah & Tom B.",
    title: "Family CBI Applicants, Grenada",
    content:
      "The family dashboard was a lifesaver. Tracking four passports, three applications, and all the supporting docs — we could see it all in one place.",
    rating: 5,
  },
  {
    name: "Yuki M.",
    title: "Malta Residency Applicant",
    content:
      "The messaging feature meant I didn't have to chase my advisor via email. Quick, secure, and everything was logged for my records.",
    rating: 5,
  },
  {
    name: "Olga P.",
    title: "Greece Golden Visa Applicant",
    content:
      "I was nervous about sharing sensitive financial documents online, but the encryption and security badges gave me confidence. Best portal I've used.",
    rating: 5,
  },
];

const steps = [
  { number: "01", title: "Sign In Securely", description: "Magic-link authentication — no passwords. Your data is encrypted end-to-end." },
  { number: "02", title: "Track Your Cases", description: "Real-time progress on every application. See exactly where you stand and what's next." },
  { number: "03", title: "Upload Documents", description: "Securely upload required documents. See which are verified, pending, or outstanding." },
  { number: "04", title: "Stay Connected", description: "Message your advisor directly. Get WhatsApp notifications on milestones." },
];

export default function ClientPortalMarketingPage() {
  return (
    <main className="min-h-screen">
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden -mt-16 md:-mt-20">
        <Image
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920"
          alt="Professional reviewing immigration documents on a laptop — representing the Global Mobility Client Portal experience"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-navy/80 via-navy/70 to-navy/90" />
        <div className="absolute inset-0 bg-mesh opacity-60" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <ScrollReveal>
            <span className="mb-6 inline-block rounded-full bg-teal/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-light">
              Client Portal
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
              Your Immigration Journey,
              <br />
              <span className="gradient-text">In Your Hands</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mb-10 max-w-3xl text-xl text-gray-300 md:text-2xl">
              Track your case progress, upload documents, manage family
              members, and communicate with your advisor — all in one secure
              portal.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/sign-in"
                className="btn-press inline-flex items-center justify-center rounded-xl bg-teal px-8 py-4 text-lg font-bold text-white shadow-lg shadow-teal/30 transition-all hover:bg-teal-light"
              >
                Access My Cases
              </Link>
              <Link
                href="#how-it-works"
                className="btn-press inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur transition-all hover:bg-white/20"
              >
                How It Works
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
              { value: "100%", label: "Encrypted" },
              { value: "24/7", label: "Portal Access" },
              { value: "< 2min", label: "Avg. Upload Time" },
              { value: "GDPR", label: "Compliant" },
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

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <span className="mb-4 inline-block rounded-full bg-amber/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber">
                Simple
              </span>
              <h2 className="text-3xl font-bold text-navy md:text-5xl">
                How It Works
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Your entire immigration journey — organized, transparent, and
                always just a click away.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 0.1}>
                <div className="hover-lift relative rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                  <span className="text-5xl font-bold text-teal/15">
                    {step.number}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-navy">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section id="features" className="bg-gray-50 px-4 py-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <AnimatedFeatures />
        </div>
      </section>

      {/* ═══════════════════════ SECURITY ═══════════════════════ */}
      <section id="security" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <ScrollReveal direction="left">
              <span className="mb-4 inline-block rounded-full bg-emerald/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald">
                Security
              </span>
              <h2 className="mb-6 text-3xl font-bold text-navy md:text-5xl">
                Your Data is{" "}
                <span className="text-emerald">Protected</span>
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                We handle sensitive personal and financial data with the
                highest security standards — because your immigration journey
                deserves nothing less.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "AES-256 Encryption",
                  "Immutable Audit Trail",
                  "GDPR & POPIA Compliant",
                  "Two-Factor Auth",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald" />
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
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800"
                  alt="Lock symbol on screen representing bank-grade security — Global Mobility Client Portal"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy/40 to-transparent" />
                <div className="glass-card absolute bottom-6 left-6 right-6 rounded-xl p-4">
                  <div className="flex items-center gap-6 text-white">
                    <div>
                      <div className="text-2xl font-bold">AES-256</div>
                      <div className="text-xs text-gray-300">Encryption</div>
                    </div>
                    <div className="h-10 w-px bg-white/20" />
                    <div>
                      <div className="text-2xl font-bold">SOC 2</div>
                      <div className="text-xs text-gray-300">Certified</div>
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

      {/* ═══════════════════════ REVIEWS ═══════════════════════ */}
      <section id="testimonials" className="bg-gray-50 px-4 py-24 md:px-6">
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
