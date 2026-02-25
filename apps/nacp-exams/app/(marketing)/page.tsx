/**
 * NACP Exams — Marketing Landing Page
 * ────────────────────────────────────
 * Premium, Nzila-quality public site with scroll-triggered reveals,
 * rich imagery, and consistent section patterns.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from '@/components/public/scroll-reveal';

export const metadata: Metadata = {
  title: 'NACP Exams — Secure National Examination Management',
  description: 'End-to-end examination lifecycle management: session scheduling, candidate tracking, integrity verification, and tamper-proof result compilation. Powered by Nzila.',
  openGraph: {
    title: 'NACP Exams — Secure National Examination Management',
    description: 'Auditable, tamper-proof examination workflows for national bodies. Session scheduling, marking, integrity checks, and result compilation.',
    images: [{ url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&q=80', width: 1200, height: 630, alt: 'Students taking a national examination — NACP Exams platform' }],
  },
};

const features = [
  {
    title: 'Session Management',
    description: 'Schedule, open, seal, and export exam sessions with full state-machine enforcement. Every transition is audited.',
    icon: '📋',
  },
  {
    title: 'Candidate Tracking',
    description: 'Register candidates per center, track submissions, and manage results with org-scoped isolation.',
    icon: '👤',
  },
  {
    title: 'Integrity Verification',
    description: 'SHA-256 hashing of sealed sessions, chain-of-custody artifacts, and tamper-evident submission records.',
    icon: '🔒',
  },
  {
    title: 'Result Compilation',
    description: 'Automated marking aggregation, moderation workflows, and exportable result packages with full audit trail.',
    icon: '📊',
  },
  {
    title: 'Multi-Center Operations',
    description: 'Manage hundreds of exam centers with regional coordinators, invigilators, and supervisors — all role-gated.',
    icon: '🏫',
  },
  {
    title: 'Offline-Ready Sync',
    description: 'Queue-based sync for remote centers with intermittent connectivity. Nothing gets lost.',
    icon: '📡',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden -mt-16 md:-mt-20">
        <Image
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920"
          alt="Students taking a national examination — representing the integrity NACP Exams protects"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-navy/80 via-navy/70 to-navy/90" />
        <div className="absolute inset-0 bg-mesh opacity-60" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <ScrollReveal>
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full bg-electric/20 text-electric-light mb-6">
              Tamper-Proof National Examinations
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Secure Exams,<br />
              <span className="gradient-text">Trusted Results</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl">
              End-to-end examination lifecycle management — from session scheduling
              to result compilation — with cryptographic integrity at every step.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/demo-request"
                className="inline-flex items-center justify-center px-8 py-4 bg-electric text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-lg shadow-lg shadow-electric/30 btn-press"
              >
                Request a Demo
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-lg btn-press"
              >
                Learn More
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-white/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS BAR ═══════════════════════ */}
      <section className="relative bg-navy-light py-16 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500K+', label: 'Candidates Managed' },
              { value: '1,200+', label: 'Exam Centers' },
              { value: '99.97%', label: 'Integrity Score' },
              { value: '0', label: 'Result Disputes' },
            ].map((stat) => (
              <ScrollReveal key={stat.label}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 font-medium text-sm tracking-wider uppercase">
                    {stat.label}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section className="py-24 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full bg-electric/10 text-electric mb-4">
                Platform Features
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-navy mb-4">
                Everything You Need for <span className="text-electric">National Exams</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Purpose-built for examination bodies that demand transparency,
                auditability, and zero-compromise integrity.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 0.1}>
                <div className="glass-card-light rounded-2xl p-8 hover-lift">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-navy mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MISSION ═══════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full bg-electric/10 text-electric mb-4">
                Our Mission
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-navy mb-6">
                Examinations That <span className="text-electric">Build Trust</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                NACP Exams was born from the reality that national examination
                systems in many countries still rely on paper manifests, manual
                tallying, and opaque processes. We built a platform that brings
                cryptographic integrity, real-time visibility, and democratic
                accountability to the examination lifecycle.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Tamper-Evident', 'Full Audit Trail', 'Role-Based Access', 'Offline Capable'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-electric" />
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="relative rounded-2xl overflow-hidden aspect-4/3">
                <Image
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800"
                  alt="Examination hall with students — representing the integrity NACP Exams delivers"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 glass-card rounded-xl p-4">
                  <div className="flex items-center gap-6 text-white">
                    <div>
                      <div className="text-2xl font-bold">7</div>
                      <div className="text-xs text-gray-300">Roles</div>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div>
                      <div className="text-2xl font-bold">SHA-256</div>
                      <div className="text-xs text-gray-300">Integrity</div>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div>
                      <div className="text-2xl font-bold">E2E</div>
                      <div className="text-xs text-gray-300">Encrypted</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="py-24 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Modernize Your <span className="gradient-text">Examinations?</span>
            </h2>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              Join examination bodies that trust NACP Exams for secure, auditable,
              and transparent national examination management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo-request"
                className="inline-flex items-center justify-center px-8 py-4 bg-electric text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-lg shadow-lg shadow-electric/30 btn-press"
              >
                Request a Demo
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-lg btn-press"
              >
                Contact Us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
