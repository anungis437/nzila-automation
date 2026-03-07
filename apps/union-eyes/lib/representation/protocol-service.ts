// ============================================================================
// REPRESENTATION PROTOCOL — CONFIGURATION SERVICE
// ============================================================================
// Server-side service for reading / writing the per-org representation
// protocol from `org_configurations`.
//
// Storage key:  category = "grievance", key = "representation_protocol"
// ============================================================================

import { db } from "@/db/db";
import { eq, and } from "drizzle-orm";
import { orgConfigurations } from "@/db/schema";
import {
  type RepresentationProtocol,
  PROTOCOL_STEWARD_LED,
} from "./protocol-types";

const CONFIG_CATEGORY = "grievance";
const CONFIG_KEY = "representation_protocol";

// ============================================================================
// READ
// ============================================================================

/**
 * Retrieve the representation protocol for an organization.
 * Falls back to the default steward-led protocol if none is configured.
 */
export async function getRepresentationProtocol(
  organizationId: string,
): Promise<RepresentationProtocol> {
  const row = await db.query.orgConfigurations.findFirst({
    where: and(
      eq(orgConfigurations.organizationId, organizationId),
      eq(orgConfigurations.category, CONFIG_CATEGORY),
      eq(orgConfigurations.key, CONFIG_KEY),
    ),
  });

  if (!row?.value) {
    return PROTOCOL_STEWARD_LED;
  }

  return row.value as RepresentationProtocol;
}

// ============================================================================
// WRITE
// ============================================================================

/**
 * Save (upsert) the representation protocol for an organization.
 *
 * Uses Postgres ON CONFLICT to upsert on (organization_id, category, key).
 */
export async function saveRepresentationProtocol(
  organizationId: string,
  protocol: RepresentationProtocol,
  updatedBy: string,
): Promise<void> {
  await db
    .insert(orgConfigurations)
    .values({
      organizationId,
      category: CONFIG_CATEGORY,
      key: CONFIG_KEY,
      value: protocol,
      description: "Per-union representation protocol — defines who files and manages grievances.",
      updatedBy,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        orgConfigurations.organizationId,
        orgConfigurations.category,
        orgConfigurations.key,
      ],
      set: {
        value: protocol,
        updatedBy,
        updatedAt: new Date(),
      },
    });
}

// ============================================================================
// DELETE (reset to default)
// ============================================================================

/**
 * Remove the custom protocol, reverting the org to the default steward-led model.
 */
export async function resetRepresentationProtocol(
  organizationId: string,
): Promise<void> {
  await db
    .delete(orgConfigurations)
    .where(
      and(
        eq(orgConfigurations.organizationId, organizationId),
        eq(orgConfigurations.category, CONFIG_CATEGORY),
        eq(orgConfigurations.key, CONFIG_KEY),
      ),
    );
}
