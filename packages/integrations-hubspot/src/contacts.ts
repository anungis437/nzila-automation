/* ── HubSpot Contact Sync ─────────────────────────────────
 *
 * HubSpot remains source of truth for lead generation.
 * NzilaOS stores mobility profile, family structure,
 * case workflow, and compliance data.
 *
 * Mapping: hubspot_contact_id → mobility_clients table
 */

import { z } from 'zod'

/* ── Schemas ──────────────────────────────────────────────── */

export const hubspotContactSchema = z.object({
  id: z.string(),
  properties: z.object({
    firstname: z.string().nullable().default(null),
    lastname: z.string().nullable().default(null),
    email: z.string().email().nullable().default(null),
    phone: z.string().nullable().default(null),
    country: z.string().nullable().default(null),
    lifecyclestage: z.string().nullable().default(null),
  }),
})

export type HubspotContact = z.infer<typeof hubspotContactSchema>

export interface ContactSyncResult {
  hubspotContactId: string
  clientId: string | null
  action: 'created' | 'updated' | 'skipped'
  details: string
}

/* ── HubSpot Client Interface ─────────────────────────────── */

export interface HubspotClient {
  getContact(contactId: string): Promise<HubspotContact>
  listContacts(opts?: { limit?: number; after?: string }): Promise<{
    results: HubspotContact[]
    paging?: { next?: { after: string } }
  }>
}

/* ── Sync Functions ───────────────────────────────────────── */

/**
 * Sync a single HubSpot contact into the mobility platform.
 * Caller is responsible for providing DB persistence.
 */
export async function syncHubspotContact(
  client: HubspotClient,
  contactId: string,
  persist: (contact: HubspotContact) => Promise<{ clientId: string; action: 'created' | 'updated' }>,
): Promise<ContactSyncResult> {
  const contact = await client.getContact(contactId)
  const parsed = hubspotContactSchema.parse(contact)

  const result = await persist(parsed)

  return {
    hubspotContactId: parsed.id,
    clientId: result.clientId,
    action: result.action,
    details: `Contact ${parsed.properties.firstname ?? ''} ${parsed.properties.lastname ?? ''} ${result.action}`,
  }
}
