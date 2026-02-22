/**
 * Dashboard layout for Template App
 * This layout removes the global header from all dashboard pages
 * and applies the dashboard-specific styling
 */
import React, { ReactNode } from "react";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { revalidatePath } from "next/cache";
import CancellationPopup from "@/components/cancellation-popup";
import WelcomeMessagePopup from "@/components/welcome-message-popup";
import PaymentSuccessPopup from "@/components/payment-success-popup";
import { OrganizationSelector } from "@/components/organization/organization-selector";
import { OrganizationBreadcrumb } from "@/components/organization/organization-breadcrumb";
import LanguageSwitcher from "@/components/language-switcher";
import { cookies } from "next/headers";
import type { SelectProfile } from "@/db/schema/domains/member";
import { logger } from "@/lib/logger";
import { getUserRoleInOrganization, getOrganizationIdForUser } from "@/lib/organization-utils";
import { db } from "@/db/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ExpiredCreditsChecker } from "@/components/billing/expired-credits-checker";

/**
 * Check if a free user with an expired billing cycle needs their credits downgraded
 * This function handles users who canceled their subscription but still have pro-level credits
 * When their billing cycle ends, we reduce their credit allowance to the free tier level
 */
async function checkExpiredSubscriptionCredits(profile: SelectProfile | null): Promise<SelectProfile | null> {
  if (!profile) return profile;

  // Only check free users with billing cycle info (canceled subscriptions)
  if (profile.membership === "free" && profile.billingCycleEnd) {
    const billingCycleEnd = new Date(profile.billingCycleEnd);
    const now = new Date();
    
    // If billing cycle ended and they still have pro-level credits
    if (now > billingCycleEnd && (profile.usageCredits || 0) > 5) {
      logger.info(`User ${profile.userId} has expired billing cycle, downgrading credits to free tier`);
      
      // Set up the update data
      const updateData: any = {
        usageCredits: 5,
        usedCredits: 0,  // Reset to 0 for a clean slate
        status: "canceled" // Update status to reflect canceled subscription
      };
      
      // If they don&apos;t have a nextCreditRenewal date, set one
      if (!profile.nextCreditRenewal) {
        const nextRenewal = new Date();
        nextRenewal.setDate(nextRenewal.getDate() + 28); // 4 weeks from now
        updateData.nextCreditRenewal = nextRenewal;
      }
      
      // We keep the billingCycleEnd to remember when they canceled
      // but we&apos;ll no longer check it after this point
      
      // Update profile with free tier credit limit
      const updatedProfile = await updateProfile(profile.userId, updateData);
      
      // Revalidate pages that display credit information
      revalidatePath("/dashboard");
      revalidatePath("/notes");
      
      return updatedProfile;
    }
  }
  
  return profile;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Fetch user profile once at the layout level
  const { userId } = await auth();

  if (!userId) {
    return redirect("/login");
  }

  let profile = (await db.select().from(profiles).where(eq(profiles.userId, userId)))[0] ?? null;

  // Auto-create profile if it doesn&apos;t exist (prevents redirect loop)
  if (!profile) {
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
    
    logger.info(`Auto-creating profile for user ${userId} (${userEmail})`);
    
    try {
      // Create the profile
      const profileData = {
        userId: userId,
        email: userEmail,
      };
      
      await db.insert(profiles).values(profileData);
      
      // Fetch the newly created profile
      profile = (await db.select().from(profiles).where(eq(profiles.userId, userId)))[0] ?? null;
      
      if (!profile) {
        logger.error(`Failed to create profile for user ${userId}`);
        return redirect("/sign-up");
      }
      
      logger.info(`Successfully created profile ${profile.id} for user ${userId}`);
    } catch (error) {
      logger.error(`Error creating profile for user ${userId}:`, error);
      return redirect("/sign-up");
    }
  }

  // Credit check is triggered client-side to avoid blocking the layout render
  
  // Verify profile is still valid after check
  if (!profile) {
    return redirect("/sign-up");
  }

  // Get the current user to extract email
  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
  
  // Get user's organization and role
  const organizationId = await getOrganizationIdForUser(userId);
  const userRole = await getUserRoleInOrganization(userId, organizationId) || 'member';
  
  logger.debug('User role fetched from organizationMembers', {
    userId,
    organizationId,
    role: userRole
  });
  
  // Log profile details for debugging
  logger.debug('Dashboard profile loaded', {
    userId: profile.userId,
    membership: profile.membership,
    createdAt: profile.createdAt,
    usageCredits: profile.usageCredits,
    userRole: userRole
  });

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      <ExpiredCreditsChecker />
      {/* Show welcome message popup - component handles visibility logic */}
      <WelcomeMessagePopup profile={profile} />
        
        {/* Show payment success popup - component handles visibility logic */}
        <PaymentSuccessPopup profile={profile} />
        
        {/* Show cancellation popup directly if status is canceled */}
        {profile.status === "canceled" && (
          <CancellationPopup profile={profile} />
        )}
        
        {/* Sidebar component with profile data and user email */}
        <Sidebar 
          profile={profile} 
          userEmail={userEmail} 
          whopMonthlyPlanId={process.env.WHOP_PLAN_ID_MONTHLY || ''}
          whopYearlyPlanId={process.env.WHOP_PLAN_ID_YEARLY || ''}
          userRole={userRole}
        />
        
        {/* Main content area with organization selector */}
        <div className="flex-1 overflow-auto relative">
          {/* Organization selector and breadcrumb in header - sticky at top */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center min-h-[60px]">
            <OrganizationBreadcrumb />
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <OrganizationSelector />
            </div>
          </div>
          
          {/* Page content */}
          <div className="p-6 mt-2">
            {children}
          </div>
        </div>
      </div>
  );
} 
