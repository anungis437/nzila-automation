'use client';

import Image from 'next/image';
import { useState } from 'react';
import ScrollReveal from '@/components/public/ScrollReveal';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    vertical: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const verticals = [
    'Healthtech', 'Uniontech', 'Insurtech', 'Legaltech', 'Fintech',
    'Trade & Commerce', 'Justice & Equity', 'Entertainment',
    'Agrotech', 'EdTech', 'Other',
  ];

  const inputClasses =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-electric/40 focus:border-electric transition text-gray-900 placeholder-gray-400';

  return (
    <main className="min-h-screen">
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920"
          alt="Modern open-plan office with floor-to-ceiling windows and warm natural light"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/70 to-navy/90" />
        <div className="absolute inset-0 bg-mesh opacity-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <ScrollReveal>
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full bg-gold/20 text-gold mb-6">
              Connect
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Get In Touch</h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Let&apos;s discuss how Nzila Ventures can accelerate your organization&apos;s AI transformation.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════ CONTACT CONTENT ═══════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* ── FORM ── */}
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-3xl font-bold text-navy mb-2">Send Us a Message</h2>
                <p className="text-gray-500 mb-8">We&apos;ll get back to you within 24-48 hours.</p>

                {submitted && (
                  <div className="mb-6 p-4 bg-emerald/5 border border-emerald/20 rounded-xl">
                    <p className="text-emerald font-medium">
                      Thank you! Your message has been sent successfully.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-navy mb-1.5">
                      Full Name *
                    </label>
                    <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className={inputClasses} placeholder="John Doe" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-navy mb-1.5">
                      Email Address *
                    </label>
                    <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputClasses} placeholder="john@example.com" />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-navy mb-1.5">
                      Company / Organization
                    </label>
                    <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className={inputClasses} placeholder="Acme Inc." />
                  </div>

                  <div>
                    <label htmlFor="vertical" className="block text-sm font-semibold text-navy mb-1.5">
                      Industry / Vertical
                    </label>
                    <select id="vertical" name="vertical" value={formData.vertical} onChange={handleChange} className={inputClasses}>
                      <option value="">Select a vertical…</option>
                      {verticals.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-navy mb-1.5">
                      Message *
                    </label>
                    <textarea id="message" name="message" required value={formData.message} onChange={handleChange} rows={5} className={inputClasses} placeholder="Tell us about your needs…" />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-electric text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all text-lg shadow-lg shadow-electric/25 btn-press"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </ScrollReveal>

            {/* ── SIDEBAR ── */}
            <ScrollReveal direction="right">
              <div>
                <h2 className="text-3xl font-bold text-navy mb-2">Contact Information</h2>
                <p className="text-gray-500 mb-8">
                  Reach out through any channel — we&apos;re here to help transform your vision.
                </p>

                <div className="space-y-6">
                  {[
                    { icon: '✉️', title: 'Email', value: 'contact@nzilaventures.com', href: 'mailto:contact@nzilaventures.com', sub: 'We respond within 24-48 hours' },
                    { icon: '📞', title: 'Phone', value: '+1 (234) 567-890', href: 'tel:+1234567890', sub: 'Mon – Fri, 9 AM – 5 PM EST' },
                    { icon: '🌍', title: 'Office', value: 'Remote-First · Global Operations', href: '', sub: 'Teams across multiple time zones' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover-lift cursor-default">
                      <span className="text-2xl mt-0.5">{item.icon}</span>
                      <div>
                        <h3 className="font-semibold text-navy mb-0.5">{item.title}</h3>
                        {item.href ? (
                          <a href={item.href} className="text-electric hover:underline font-medium">{item.value}</a>
                        ) : (
                          <p className="text-gray-700 font-medium">{item.value}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Business Inquiries */}
                <div className="mt-10 bg-navy rounded-2xl p-6 text-white pulse-glow">
                  <h3 className="font-bold text-lg mb-3">Business Inquiries</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    For partnerships, investment discussions, or platform collaborations:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {['Platform integration opportunities', 'Vertical-specific solutions', 'Strategic partnerships', 'Investment discussions'].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ BOTTOM CTA ═══════════════════════ */}
      <section className="py-16 bg-gray-50 text-center">
        <ScrollReveal>
          <h2 className="text-2xl font-bold text-navy mb-3">Existing Partner?</h2>
          <p className="text-gray-500 mb-6">Access the corporate dashboard for your team.</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center px-8 py-4 bg-navy text-white font-bold rounded-xl hover:bg-gray-800 transition text-lg shadow-lg shadow-navy/25 btn-press"
          >
            Team Portal Login →
          </a>
        </ScrollReveal>
      </section>
    </main>
  );
}
