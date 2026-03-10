/* ── HubSpot Deal Sync ────────────────────────────────────
 *
 * Mapping: hubspot_deal_id → mobility_cases table
 * Syncs deal stage, amount, and pipeline info.
 */

import { z } from 'zod'

/* ── Schemas ──────────────────────────────────────────────── */

export const hubspotDealSchema = z.object({
  id: z.string(),
  properties: z.object({
    dealname: z.string().nullable().default(null),
    amount: z.string().nullable().default(null),
    dealstage: z.string().nullable().default(null),
    pipeline: z.string().nullable().default(null),
    closedate: z.string().nullable().default(null),
  }),
  associations: z
    .object({
      contacts: z
        .object({
          results: z.array(z.object({ id: z.string() })),
        })
        .optional(),
    })
    .optional(),
})

export type HubspotDeal = z.infer<typeof hubspotDealSchema>

export interface DealSyncResult {
  hubspotDealId: string
  caseId: string | null
  action: 'created' | 'updated' | 'skipped'
  details: string
}

/* ── HubSpot Deals Client ─────────────────────────────────── */

export interface HubspotDealsClient {
  getDeal(dealId: string): Promise<HubspotDeal>
  listDeals(opts?: { limit?: number; after?: string }): Promise<{
    results: HubspotDeal[]
    paging?: { next?: { after: string } }
  }>
}

/* ── Sync Functions ───────────────────────────────────────── */

/**
 * Sync a single HubSpot deal into the mobility platform.
 */
export async function syncHubspotDeal(
  client: HubspotDealsClient,
  dealId: string,
  persist: (deal: HubspotDeal) => Promise<{ caseId: string; action: 'created' | 'updated' }>,
): Promise<DealSyncResult> {
  const deal = await client.getDeal(dealId)
  const parsed = hubspotDealSchema.parse(deal)

  const result = await persist(parsed)

  return {
    hubspotDealId: parsed.id,
    caseId: result.caseId,
    action: result.action,
    details: `Deal "${parsed.properties.dealname ?? dealId}" ${result.action}`,
  }
}
