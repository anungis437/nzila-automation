/**
 * Zonga — Marketing Landing Page
 * ───────────────────────────────
 * Premium, Nzila-quality public site celebrating African music
 * and creators with scroll-triggered reveals and rich imagery.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from '@/components/public/scroll-reveal';

export const metadata: Metadata = {
  title: 'Zonga — Music Without Borders',
  description: 'The fair-share music platform — transparent royalties, instant payouts, and full creative ownership for African artists and creators.',
  openGraph: {
    title: 'Zonga — Music Without Borders',
    description: 'Transparent royalties, instant payouts, and full creative ownership for African artists and creators.',
    images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop&q=80', width: 1200, height: 630, alt: 'African musician performing — Zonga music platform' }],
  },
};

const features = [
  {
    title: 'Fair Revenue Split',
    description: 'Transparent royalty calculations with real-time breakdown by stream, download, licensing, sync, and more.',
    icon: '💰',
  },
  {
    title: 'Instant Payouts',
    description: 'Request payouts anytime. No 90-day holds, no black-box deductions — just your money, fast.',
    icon: '⚡',
  },
  {
    title: 'Full Creative Control',
    description: 'You own your masters. Upload, distribute, and manage your catalog with complete creative ownership.',
    icon: '🎵',
  },
  {
    title: 'Multi-Format Catalog',
    description: 'Release tracks, albums, podcasts, and music videos — all managed from a single dashboard.',
    icon: '📀',
  },
  {
    title: 'Audio Fingerprinting',
    description: 'Automated content protection with audio fingerprinting and copyright verification on every upload.',
    icon: '🔒',
  },
  {
    title: 'Audience Analytics',
    description: 'Deep listener analytics by geography, demographics, and trends. Know your audience.',
    icon: '📊',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden -mt-16 md:-mt-20">
        <Image
          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920"
          alt="African musician performing live — representing the creative spirit Zonga empowers"
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
              African Music, Global Stage
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Your Music,<br />
              <span className="gradient-text">Your Revenue</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl">
              The fair-share music platform — transparent royalties, instant payouts,
              and full creative ownership for African artists and creators.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-electric text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-lg shadow-lg shadow-electric/30 btn-press"
              >
                Start Distributing
              </Link>
              <Link
                href="/for-labels"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-lg btn-press"
              >
                For Labels
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
              { value: '50K+', label: 'Creators' },
              { value: '2M+', label: 'Tracks' },
              { value: '85%', label: 'Revenue Share' },
              { value: '<24h', label: 'Payout Speed' },
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
                Built for <span className="text-electric">African Creators</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to distribute, monetize, and grow your music
                — with transparency at every step.
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
                Music That <span className="text-electric">Empowers</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Zonga was born from a simple belief: African creators deserve the
                same tools, transparency, and revenue share as artists anywhere in
                the world. We built a platform that makes that possible — with
                fair royalties, instant payouts, and full creative ownership.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['85% Revenue Share', 'No Hidden Fees', 'Own Your Masters', 'Global Distribution'].map((item) => (
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
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"
                  alt="Music studio — representing the creative tools Zonga provides to African artists"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 glass-card rounded-xl p-4">
                  <div className="flex items-center gap-6 text-white">
                    <div>
                      <div className="text-2xl font-bold">85%</div>
                      <div className="text-xs text-gray-300">Revenue Share</div>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div>
                      <div className="text-2xl font-bold">Instant</div>
                      <div className="text-xs text-gray-300">Payouts</div>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div>
                      <div className="text-2xl font-bold">100%</div>
                      <div className="text-xs text-gray-300">Ownership</div>
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
              Ready to Share Your <span className="gradient-text">Music?</span>
            </h2>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of African creators who trust Zonga for transparent
              royalties, instant payouts, and full creative ownership.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-electric text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-lg shadow-lg shadow-electric/30 btn-press"
              >
                Start Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-lg btn-press"
              >
                View Pricing
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
