export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Accessibility, Monitor, Keyboard, Eye, MessageCircle } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: 'Accessibility | Union Eyes',
    description:
      'Our commitment to making Union Eyes accessible to all users, including those with disabilities.',
  };
}

export default async function AccessibilityPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Accessibility className="h-8 w-8 text-violet-600" />
            <h1 className="text-4xl font-bold text-gray-900">Accessibility Statement</h1>
          </div>
          <p className="text-lg text-gray-600">
            Last updated: March 1, 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <p className="text-gray-700 text-lg">
              Union Eyes is committed to ensuring digital accessibility for people of
              all abilities. We are continually improving the user experience for
              everyone and applying relevant accessibility standards.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Standards Compliance</h2>
            </div>
            <p className="text-gray-700">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1
              Level AA and comply with the Accessible Canada Act (ACA). Our platform is
              regularly audited for accessibility compliance.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Keyboard className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Accessibility Features</h2>
            </div>
            <ul className="text-gray-700 space-y-2">
              <li>Full keyboard navigation support</li>
              <li>Screen reader compatibility (NVDA, JAWS, VoiceOver)</li>
              <li>High contrast mode and customizable colour schemes</li>
              <li>Resizable text without loss of functionality</li>
              <li>Alternative text for all meaningful images</li>
              <li>ARIA landmarks and semantic HTML structure</li>
              <li>Bilingual support (English and French)</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Known Limitations</h2>
            </div>
            <p className="text-gray-700">
              While we strive for full accessibility, some third-party components
              (such as embedded payment forms) may have limitations. We are actively
              working with our vendors to improve these areas.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Feedback</h2>
            </div>
            <p className="text-gray-700">
              We welcome your feedback on the accessibility of Union Eyes. Please
              contact us at{' '}
              <a href="mailto:accessibility@unioneyes.com" className="text-violet-600 hover:text-violet-700">
                accessibility@unioneyes.com
              </a>{' '}
              if you encounter any barriers or have suggestions for improvement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
