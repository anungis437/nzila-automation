"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import WhopPricingCard from "./whop-pricing-card";
import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
 
 
 
import { motion, AnimatePresence } from "framer-motion";

export interface PricingLabels {
  heading: string;
  subtitle: string;
  monthly: string;
  yearly: string;
  free: string;
  freeDesc: string;
  forever: string;
  getStarted: string;
  pro: string;
  proDesc: string;
  upgradeToPro: string;
  mostPopular: string;
  enterprise: string;
  enterpriseDesc: string;
  custom: string;
  contactUs: string;
  whatsIncluded: string;
  trustLine1: string;
  trustLine2: string;
  billedAnnually: string;
  month: string;
  year: string;
  freeBenefits: string[];
  proBenefits: string[];
  entBenefits: string[];
}

const defaultLabels: PricingLabels = {
  heading: "Plans for Every Union",
  subtitle: "From small locals to national federations — pick the plan that fits your needs",
  monthly: "Monthly",
  yearly: "Yearly",
  free: "Free",
  freeDesc: "Try UnionEyes with basic AI search",
  forever: "/forever",
  getStarted: "Get Started",
  pro: "Pro",
  proDesc: "Everything your union needs to manage grievances, members & advocacy.",
  upgradeToPro: "Upgrade to Pro",
  mostPopular: "Most Popular",
  enterprise: "Enterprise",
  enterpriseDesc: "For national federations & large-scale deployments",
  custom: "Custom",
  contactUs: "Contact Us",
  whatsIncluded: "What's included",
  trustLine1: "All plans include PIPEDA-compliant data handling and bilingual (EN/FR) support.",
  trustLine2: "Credits renew every 28 days. Cancel anytime — no lock-in contracts.",
  billedAnnually: "Billed annually",
  month: "month",
  year: "year",
  freeBenefits: [
    "5 AI credits (one-time)",
    "Basic grievance search",
    "Single user access",
    "AI triage & drafting",
    "Precedent research",
    "CBA clause extraction",
    "Analytics & reporting",
  ],
  proBenefits: [
    "1,000 AI credits per cycle",
    "AI-powered grievance triage",
    "Precedent research & matching",
    "CBA clause extraction",
    "Full claims & arbitration toolkit",
    "Multi-role team collaboration",
    "Analytics & report builder",
    "Priority support",
  ],
  entBenefits: [
    "Unlimited AI credits",
    "Everything in Pro",
    "Predictive models & forecasting",
    "Custom workflows & automations",
    "API access & webhooks",
    "Bulk export & integrations",
    "Dedicated account manager",
    "On-premise deployment option",
  ],
};

interface PricingPageClientProps {
  userId: string | null;
  activePaymentProvider: string;
  whopRedirectUrl: string;
  whopMonthlyLink: string;
  whopYearlyLink: string;
  whopMonthlyPlanId: string;
  whopYearlyPlanId: string;
  stripeMonthlyLink: string;
  stripeYearlyLink: string;
  monthlyPrice: string;
  yearlyPrice: string;
  labels?: PricingLabels;
}

/**
 * Client component for the pricing page
 * Shows Free / Pro / Enterprise tiers with monthly-yearly toggle for Pro
 */
export default function PricingPageClient({
  userId,
  activePaymentProvider,
  whopRedirectUrl,
  whopMonthlyLink: _whopMonthlyLink,
  whopYearlyLink: _whopYearlyLink,
  whopMonthlyPlanId,
  whopYearlyPlanId,
  stripeMonthlyLink,
  stripeYearlyLink,
  monthlyPrice,
  yearlyPrice,
  labels: labelsProp,
}: PricingPageClientProps) {
  const l = labelsProp ?? defaultLabels;
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // Calculate yearly savings
  const monthlyCost = parseInt(monthlyPrice.replace(/[^0-9]/g, ''));
  const yearlyCost = parseInt(yearlyPrice.replace(/[^0-9]/g, ''));
  const annualMonthlyCost = monthlyCost * 12;
  const savings = annualMonthlyCost - yearlyCost;
  const savingsPercentage = Math.round((savings / annualMonthlyCost) * 100);
  const savingsAmount = `$${savings}`;

  // Build benefit arrays from labels
  const freeBenefits = l.freeBenefits.map((text, i) => ({ text, included: i < 3 }));
  const proBenefits = l.proBenefits.map((text) => ({ text, included: true }));
  const enterpriseBenefits = l.entBenefits.map((text) => ({ text, included: true }));

  return (
    <div className="container mx-auto py-16 max-w-6xl px-4">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-5xl font-bold">{l.heading}</h1>
        <p className="text-xl text-muted-foreground mt-4">
          {l.subtitle}
        </p>
        
        {/* Billing toggle */}
        <div className="flex justify-center mt-8">
          <ToggleGroup 
            type="single" 
            value={billingCycle}
            onValueChange={(value) => value && setBillingCycle(value as "monthly" | "yearly")}
            className="border rounded-full p-1.5 bg-white shadow-sm"
          >
            <ToggleGroupItem 
              value="monthly" 
              className="rounded-full px-10 py-2.5 text-base font-medium data-[state=on]:bg-black data-[state=on]:text-white transition-all"
            >
              {l.monthly}
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="yearly" 
              className="rounded-full px-10 py-2.5 text-base font-medium data-[state=on]:bg-black data-[state=on]:text-white transition-all"
            >
              {l.yearly}
              {billingCycle !== "yearly" && (
                <span className="ml-2 text-xs text-purple-600 font-semibold">{l.yearly} {savingsPercentage}%</span>
              )}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* ── Three-tier grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* ── FREE ─────────────────────────────────────────────────── */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="px-6 py-6">
            <CardTitle className="text-2xl font-bold">{l.free}</CardTitle>
            <CardDescription className="text-base text-gray-500 mt-1">
              {l.freeDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 space-y-6">
            <div className="mb-1 flex items-baseline">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-gray-500 ml-2 text-base">{l.forever}</span>
            </div>
            <Button variant="outline" className="w-full py-4 text-base font-medium h-auto rounded-lg" asChild>
              <Link href="/sign-up">{l.getStarted}</Link>
            </Button>
            <BenefitList items={freeBenefits} whatsIncluded={l.whatsIncluded} />
          </CardContent>
        </Card>

        {/* ── PRO (main CTA) ───────────────────────────────────────── */}
        <div className="relative">
          {/* "Most Popular" badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
              {l.mostPopular}
            </span>
          </div>

          {activePaymentProvider === "stripe" ? (
            <PricingCard
              title={l.pro}
              price={billingCycle === "monthly" ? monthlyPrice : yearlyPrice}
              description={l.proDesc}
              buttonText={l.upgradeToPro}
              buttonLink={billingCycle === "monthly" ? stripeMonthlyLink : stripeYearlyLink}
              userId={userId}
              provider="stripe"
              billingCycle={billingCycle}
              savingsPercentage={savingsPercentage}
              savingsAmount={savingsAmount}
              highlighted
              labels={l}
            />
          ) : (
            <WhopPricingCard
              title={l.pro}
              price={billingCycle === "monthly" ? monthlyPrice : yearlyPrice}
              description={l.proDesc}
              buttonText={l.upgradeToPro}
              planId={billingCycle === "monthly" ? whopMonthlyPlanId : whopYearlyPlanId}
              redirectUrl={whopRedirectUrl}
              billingCycle={billingCycle}
              savingsPercentage={savingsPercentage}
              savingsAmount={savingsAmount}
              highlighted
            />
          )}
        </div>

        {/* ── ENTERPRISE ───────────────────────────────────────────── */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="px-6 py-6">
            <CardTitle className="text-2xl font-bold">{l.enterprise}</CardTitle>
            <CardDescription className="text-base text-gray-500 mt-1">
              {l.enterpriseDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 space-y-6">
            <div className="mb-1 flex items-baseline">
              <span className="text-5xl font-bold">{l.custom}</span>
            </div>
            <Button className="w-full py-4 text-base font-medium h-auto rounded-lg" asChild>
              <a href="mailto:enterprise@unioneyes.ca">{l.contactUs}</a>
            </Button>
            <BenefitList items={enterpriseBenefits} whatsIncluded={l.whatsIncluded} />
          </CardContent>
        </Card>
      </div>

      {/* ── FAQ / trust strip ──────────────────────────────────────── */}
      <div className="mt-16 text-center text-sm text-muted-foreground space-y-2">
        <p>{l.trustLine1}</p>
        <p>{l.trustLine2}</p>
      </div>
    </div>
  );
}

// ── Shared benefit list renderer ──────────────────────────────────────
function BenefitList({ items, whatsIncluded = "What's included" }: { items: { text: string; included: boolean }[]; whatsIncluded?: string }) {
  return (
    <div className="pt-4">
      <h3 className="font-semibold mb-4">{whatsIncluded}</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2.5">
            <div className={cn("shrink-0 w-4 h-4", item.included ? "text-purple-600" : "text-gray-300")}>
              {item.included ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </div>
            <span className={cn("text-sm", item.included ? "text-gray-700" : "text-gray-400")}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  userId: string | null;
  provider: 'stripe' | 'whop';
  redirectUrl?: string;
  billingCycle: "monthly" | "yearly";
  savingsPercentage: number;
  savingsAmount: string;
  highlighted?: boolean;
  labels?: PricingLabels;
}

function PricingCard({ 
  title, 
  price, 
  description, 
  buttonText, 
  buttonLink, 
  userId, 
  provider, 
  redirectUrl,
  billingCycle,
  savingsPercentage,
  savingsAmount,
  highlighted,
  labels: cardLabels,
}: PricingCardProps) {
  const cl = cardLabels ?? defaultLabels;
  // Each provider expects different parameter names
  let finalButtonLink = buttonLink;
  
  if (userId) {
    if (provider === 'whop') {
      // Start with a clean URL by removing any existing parameters
      const baseUrl = buttonLink.split('?')[0];
      
      // Build parameters properly
      const params = new URLSearchParams();
      
      // Add d2c=true - CRITICAL for direct checkout without Whop account
      params.append('d2c', 'true');
      
      // Add redirect URL
      if (redirectUrl) {
        params.append('redirect', redirectUrl);
      }
      
      // Add userId both as a direct parameter and in metadata
      params.append('userId', userId);
      params.append('metadata[userId]', userId);
      
      // Construct the final URL
      finalButtonLink = `${baseUrl}?${params.toString()}`;
    } else {
      // For Stripe, keep the original 'ref' parameter
      finalButtonLink = `${buttonLink}${buttonLink.includes('?') ? '&' : '?'}ref=${userId}`;
    }
  }

  return (
    <Card className={cn(
      "rounded-2xl border shadow-sm overflow-hidden relative",
      highlighted && "border-purple-300 shadow-lg ring-1 ring-purple-200"
    )}>
      {/* Savings tag for yearly billing */}
      {billingCycle === "yearly" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -top-0.5 right-6"
        >
          <div className="bg-linear-to-r from-purple-500 to-purple-700 text-white text-xs font-bold px-4 py-1.5 rounded-b-lg shadow-sm">
            {cl.billedAnnually} — {savingsPercentage}% ({savingsAmount})
          </div>
        </motion.div>
      )}
      
      <CardHeader className="px-6 py-6">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base text-gray-500 mt-1">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="px-6 space-y-6 pb-0">
        <div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={billingCycle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-1 flex items-baseline"
            >
              <span className="text-5xl font-bold">{price}</span>
              <span className="text-gray-500 ml-2 text-base">
                /{billingCycle === "monthly" ? cl.month : cl.year}
              </span>
            </motion.div>
          </AnimatePresence>
          {billingCycle === "yearly" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center mt-1"
            >
              <span className="text-sm text-purple-600 font-medium flex items-center">
                <svg 
                  className="w-3.5 h-3.5 mr-1" 
                  fill="currentColor" 
                  viewBox="0 0 20 20" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
                {cl.billedAnnually}
              </span>
            </motion.div>
          )}
        </div>
        
        <Button
          className="w-full py-4 text-base font-medium h-auto rounded-lg"
          asChild
          variant="default"
        >
          <a
            href={finalButtonLink}
            className={cn("inline-flex items-center justify-center", finalButtonLink === "#" && "pointer-events-none opacity-50")}
          >
            {buttonText}
          </a>
        </Button>
      </CardContent>
      
      <div className="px-6 pt-6 pb-6">
        <BenefitList items={cl.proBenefits.map(text => ({ text, included: true }))} whatsIncluded={cl.whatsIncluded} />
      </div>
    </Card>
  );
} 
