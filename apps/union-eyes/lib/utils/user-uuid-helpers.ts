import { db } from "@/db/db";
import { userUuidMapping } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get or create a UUID for a Clerk userId
 * This function ensures every Clerk user has a corresponding UUID for use in foreign keys
 * 
 * @param clerkUserId - The Clerk text-based user ID (e.g., "user_2abc123...")
 * @returns The UUID associated with this Clerk user ID
 */
export async function getOrCreateUserUuid(clerkUserId: string): Promise<string> {
  // Try to find existing mapping
  const existing = await db.query.userUuidMapping.findFirst({
    where: eq(userUuidMapping.clerkUserId, clerkUserId),
  });

  if (existing) {
    return existing.userUuid;
  }

  // Create new mapping
  const [newMapping] = await db
    .insert(userUuidMapping)
    .values({
      clerkUserId,
    })
    .returning();

  return newMapping.userUuid;
}

