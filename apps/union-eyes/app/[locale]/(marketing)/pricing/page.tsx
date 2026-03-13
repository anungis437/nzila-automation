/**
 * Locale-aware Pricing page
 * Accessible at /{locale}/pricing
 */
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import nextDynamic from 'next/dynamic';
import type { PricingLabels } from '@/app/(marketing)/pricing/pricing-page-client';

const PricingPageClient = nextDynamic(
  () => import('@/app/(marketing)/pricing/pricing-page-client'),
  { ssr: true },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'marketing.pricing' });
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function LocalePricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await auth();
  const t = await getTranslations({ locale, namespace: 'marketing.pricingBody' });

  const labels: PricingLabels = {
    heading: t('plansForEveryUnion'),
    subtitle: t('plansSubtitle'),
    monthly: t('monthly'),
    yearly: t('yearly'),
    free: t('free'),
    freeDesc: t('freeDesc'),
    forever: t('forever'),
    getStarted: t('getStarted'),
    pro: t('pro'),
    proDesc: t('proDesc'),
    upgradeToPro: t('upgradeToPro'),
    mostPopular: t('mostPopular'),
    enterprise: t('enterprise'),
    enterpriseDesc: t('enterpriseDesc'),
    custom: t('custom'),
    contactUs: t('contactUs'),
    whatsIncluded: t('whatsIncluded'),
    trustLine1: t('trustLine1'),
    trustLine2: t('trustLine2'),
    billedAnnually: t('billedAnnually'),
    month: t('month'),
    year: t('year'),
    freeBenefits: [
      t('freeBenefit1'), t('freeBenefit2'), t('freeBenefit3'),
      t('freeBenefit4'), t('freeBenefit5'), t('freeBenefit6'), t('freeBenefit7'),
    ],
    proBenefits: [
      t('proBenefit1'), t('proBenefit2'), t('proBenefit3'), t('proBenefit4'),
      t('proBenefit5'), t('proBenefit6'), t('proBenefit7'), t('proBenefit8'),
    ],
    entBenefits: [
      t('entBenefit1'), t('entBenefit2'), t('entBenefit3'), t('entBenefit4'),
      t('entBenefit5'), t('entBenefit6'), t('entBenefit7'), t('entBenefit8'),
    ],
  };

  const activePaymentProvider = process.env.ACTIVE_PAYMENT_PROVIDER ?? 'stripe';
  const whopRedirectUrl =
    process.env.NEXT_PUBLIC_WHOP_REDIRECT_URL ?? 'https://whop-boilerplate.vercel.app/dashboard';
  const whopMonthlyLink = process.env.NEXT_PUBLIC_WHOP_PAYMENT_LINK_MONTHLY ?? '#';
  const whopYearlyLink = process.env.NEXT_PUBLIC_WHOP_PAYMENT_LINK_YEARLY ?? '#';
  const whopMonthlyPlanId = process.env.WHOP_PLAN_ID_MONTHLY ?? '';
  const whopYearlyPlanId = process.env.WHOP_PLAN_ID_YEARLY ?? '';

  return (
    <PricingPageClient
      userId={userId}
      activePaymentProvider={activePaymentProvider}
      whopRedirectUrl={whopRedirectUrl}
      whopMonthlyLink={whopMonthlyLink}
      whopYearlyLink={whopYearlyLink}
      whopMonthlyPlanId={whopMonthlyPlanId}
      whopYearlyPlanId={whopYearlyPlanId}
      stripeMonthlyLink={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY ?? '#'}
      stripeYearlyLink={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY ?? '#'}
      monthlyPrice="$30"
      yearlyPrice="$249"
      labels={labels}
    />
  );
}
