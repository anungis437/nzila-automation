export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Shield, Lock, Eye, Database, Trash2, Download } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: 'Privacy Policy | Union Eyes',
    description:
      'How Union Eyes collects, uses, and protects your personal information under PIPEDA and Canadian privacy law.',
  };
}

export default async function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-violet-600" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-lg text-gray-600">
            Last updated: March 1, 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Information We Collect</h2>
            </div>
            <p className="text-gray-700">
              Union Eyes collects information necessary to provide union management
              services, including: name, email address, union membership details,
              and usage data. We collect this information when you create an account,
              use our platform, or interact with our services.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">How We Use Your Information</h2>
            </div>
            <p className="text-gray-700">
              We use your information to provide and improve our services, communicate
              with you about your account, process grievances and voting, and comply
              with legal obligations. We do not sell your personal information to third
              parties.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Data Storage &amp; Security</h2>
            </div>
            <p className="text-gray-700">
              All data is stored in Canadian data centres in compliance with PIPEDA
              (Personal Information Protection and Electronic Documents Act). We use
              industry-standard encryption for data in transit and at rest, and
              implement strict access controls.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Your Rights</h2>
            </div>
            <p className="text-gray-700">
              Under Canadian privacy law, you have the right to access, correct, and
              delete your personal information. You can exercise these rights through
              your account settings or by contacting us at{' '}
              <a href="mailto:privacy@unioneyes.com" className="text-violet-600 hover:text-violet-700">
                privacy@unioneyes.com
              </a>.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Data Retention</h2>
            </div>
            <p className="text-gray-700">
              We retain your personal information only as long as necessary to provide
              our services and comply with legal obligations. When you delete your
              account, your data is permanently removed within 30 days.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this privacy policy, please contact our
              Privacy Officer at{' '}
              <a href="mailto:privacy@unioneyes.com" className="text-violet-600 hover:text-violet-700">
                privacy@unioneyes.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
