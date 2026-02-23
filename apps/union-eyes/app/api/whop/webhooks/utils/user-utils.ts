/**
this is a utils file that works with the whop webhook that will find the clerk user id from the metadata that it gets from whop
for us to use later on with our database opperations

Finds the correct user in our database by extracting the Clerk user ID from the webhook data - this is critical because
 Whop uses different IDs than our database does.

 *
 * @param data The webhook data object from Whop
 * @returns The Clerk userId if found, undefined otherwise
 */
export function extractUserId(data: Record<string, unknown>): string | undefined {
  if (!data) {
return undefined;
  }
  
  // First check metadata - this is the most reliable source
  if (data.metadata) {
if (typeof data.metadata === 'object' && data.metadata !== null) {
      // Direct object access - most common case
      if (data.metadata.clerkUserId) {
return data.metadata.clerkUserId;
      }
      
      // Log all available metadata keys to help debugging
} else if (typeof data.metadata === 'string') {
      // Handle string metadata that needs parsing
      try {
const parsedMetadata = JSON.parse(data.metadata);
        
        if (parsedMetadata.clerkUserId) {
return parsedMetadata.clerkUserId;
        }
} catch (e) {
}
    }
  } else {
}
  
  // Check membership_metadata (common in payment events)
  if (data.membership_metadata) {
if (typeof data.membership_metadata === 'object' && data.membership_metadata !== null) {
      if (data.membership_metadata.clerkUserId) {
return data.membership_metadata.clerkUserId;
      }
      
      // Log all available membership_metadata keys
}
  } else {
}
  
  // Explicitly note that the Whop user_id will NOT be used
  if (data.user_id) {
}

  // Log all top-level fields in the webhook data to help with debugging
// Check membership metadata if available
  if (data.membership && data.membership.metadata) {
if (data.membership.metadata.clerkUserId) {
return data.membership.metadata.clerkUserId;
    }
}
return undefined;
} 
