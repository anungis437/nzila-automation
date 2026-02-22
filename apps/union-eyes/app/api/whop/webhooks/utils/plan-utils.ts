/**
 * Plan-related utilities for webhook processing
 * Functions to determine plan types and billing periods
 * 
 * Figures out important details about a user's subscription plan - like whether it&apos;s monthly or yearly, when it will end
 * and converting timestamps from Whop into proper dates
 * 
 */

/**
 * Determine plan duration based on the plan ID from environment variables
 * 
 * @param planId The Whop plan ID
 * @returns "monthly" or "yearly" based on which environment variable matches
 */
export function determinePlanType(planId: string): "monthly" | "yearly" {
  const monthlyPlanId = process.env.WHOP_PLAN_ID_MONTHLY;
  const yearlyPlanId = process.env.WHOP_PLAN_ID_YEARLY;
if (planId === yearlyPlanId) {
return "yearly";
  } else if (planId === monthlyPlanId) {
return "monthly";
  } else {
    // Default to monthly if we can&apos;t determine
return "monthly";
  }
}

/**
 * Calculate billing cycle end date based on start date and plan duration
 * 
 * @param startDate The start date of the billing cycle
 * @param planDuration "monthly" or "yearly"
 * @returns Date object representing when the billing cycle ends
 */
export function calculateBillingCycleEnd(
  startDate: Date,
  planDuration: "monthly" | "yearly"
): Date {
  const endDate = new Date(startDate);
  
  if (planDuration === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    // Default to 30 days for monthly
    endDate.setDate(endDate.getDate() + 30);
  }
  
  return endDate;
}

/**
 * Convert timestamp to Date object, handling both seconds and milliseconds
 * 
 * @param timestamp Timestamp in seconds or milliseconds
 * @returns Date object
 */
export function convertTimestampToDate(timestamp: number): Date {
  // Check if timestamp is in seconds (10 digits or less) and convert to ms if needed
  if (timestamp < 9999999999) {
    return new Date(timestamp * 1000);
  }
  return new Date(timestamp);
} 
