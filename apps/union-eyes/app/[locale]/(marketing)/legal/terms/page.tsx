export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { FileText, Users, AlertTriangle, Scale, CreditCard } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: 'Terms of Service | Union Eyes',
    description:
      'Terms and conditions governing the use of Union Eyes union management platform.',
  };
}

export default async function TermsOfServicePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-violet-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-lg text-gray-600">
            Last updated: March 1, 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Acceptance of Terms</h2>
            </div>
            <p className="text-gray-700">
              By accessing or using Union Eyes, you agree to be bound by these Terms
              of Service. Union Eyes is a platform designed for union organizations
              in Canada and is governed by Canadian law.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Use of Service</h2>
            </div>
            <p className="text-gray-700">
              You may use Union Eyes solely for lawful union management purposes,
              including grievance tracking, member communication, voting, and
              organizational administration. You agree not to misuse the platform
              or attempt to access it through unauthorized means.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Subscription &amp; Billing</h2>
            </div>
            <p className="text-gray-700">
              Paid plans are billed on a monthly or annual basis as selected at
              signup. You may cancel your subscription at any time from your account
              settings. Refunds are provided on a pro-rata basis for annual plans.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-semibold text-gray-900 !mt-0">Limitation of Liability</h2>
            </div>
            <p className="text-gray-700">
              Union Eyes is provided &quot;as is&quot; without warranties of any kind.
              We are not liable for any indirect, incidental, or consequential damages
              arising from your use of the platform. Our total liability shall not
              exceed the fees paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900">Termination</h2>
            <p className="text-gray-700">
              We may suspend or terminate your account if you violate these terms.
              Upon termination, your data will be retained for 30 days to allow
              export, after which it will be permanently deleted.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-900">Contact</h2>
            <p className="text-gray-700">
              Questions about these terms? Contact us at{' '}
              <a href="mailto:legal@unioneyes.com" className="text-violet-600 hover:text-violet-700">
                legal@unioneyes.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
