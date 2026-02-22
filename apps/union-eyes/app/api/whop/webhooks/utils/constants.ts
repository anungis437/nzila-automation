/**
 * Constants for the Whop webhook system
 * These values are used in various webhook handlers
 */

// Credit allocation for different user tiers
export const FREE_TIER_CREDITS = 5; // Free users get 5 credits 
export const PRO_TIER_CREDITS = 1000; // Pro users get 1000 credits per subscription cycle

// Credit renewal cycle (independent of billing cycle)
export const CREDIT_RENEWAL_DAYS = 28; // Used credits reset every 4 weeks (28 days)

// Common paths to revalidate after webhook events
export const PATHS_TO_REVALIDATE = [
  "/dashboard",
  "/notes",
  "/",
  "/api/user/status"
];

// Success page paths
export const SUCCESS_PATHS = [
  "/dashboard?payment=success"
]; 

// Default redirect URL for Whop checkout
export const DEFAULT_REDIRECT_URL = "https://whop-boilerplate.vercel.app/dashboard"; 
