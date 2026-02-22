/**
 * Path-related utilities for webhook processing
 * Handles revalidating paths after webhook events
 * 
 * Refreshes cached website pages after changes happen - this makes sure users see their updated membership status,
 * credits, and other information without needing to manually refresh their browser.
 */

import { revalidatePath } from "next/cache";
import { PATHS_TO_REVALIDATE, SUCCESS_PATHS } from "./constants";

/**
 * Revalidate common paths to refresh data after webhook events
 * This ensures that UI components display up-to-date information
 * 
 * @param additionalPaths Optional array of additional paths to revalidate
 */
export function revalidateCommonPaths(additionalPaths: string[] = []): void {
  // Revalidate standard paths
  PATHS_TO_REVALIDATE.forEach(path => {
revalidatePath(path);
  });
  
  // Revalidate any additional paths
  additionalPaths.forEach(path => {
revalidatePath(path);
  });
}

/**
 * Revalidate paths after successful payment
 * Includes standard paths plus payment success paths
 */
export function revalidateAfterPayment(): void {
  revalidateCommonPaths(SUCCESS_PATHS);
}

/**
 * Revalidate paths after cancellation
 * Currently same as common paths, but separated for clarity
 */
export function revalidateAfterCancellation(): void {
  revalidateCommonPaths();
} 
