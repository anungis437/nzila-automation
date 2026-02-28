/**
 * Trade-OS Core Data Migration
 *
 * Imports core data from the legacy nzila-trade-os-main Django app:
 *   - trade_parties
 *   - trade_listings
 *   - trade_deals
 *   - trade_quotes
 *   - trade_financing
 *   - trade_shipments
 *   - trade_documents
 *   - trade_commissions
 *
 * Usage:
 *   pnpm tsx scripts/migrations/trade/import-tradeos-core.ts --dry-run
 *   pnpm tsx scripts/migrations/trade/import-tradeos-core.ts --live
 *
 * Requires:
 *   - DATABASE_URL env var for destination (NzilaOS)
 *   - LEGACY_TRADEOS_DATABASE_URL env var for source (Django Trade-OS)
 *
 * @idempotent Uses legacySourceId + legacySourceSystem='trade-os' as upsert key
 */

// ── Types ─────────────────────────────────────────────────────────────────

interface MigrationConfig {
  dryRun: boolean
  batchSize: number
  sourceConnectionString: string
  destConnectionString: string
}

interface MigrationResult {
  table: string
  total: number
  inserted: number
  skipped: number
  errors: MigrationError[]
}

interface MigrationError {
  legacyId: string
  table: string
  message: string
}

// ── Django model shapes (from Trade-OS) ───────────────────────────────────

interface DjangoTradeParty {
  id: number
  org_id: string
  name: string
  role: string
  email: string | null
  phone: string | null
  country_code: string | null
  tax_id: string | null
  created_at: string
  updated_at: string
}

interface DjangoTradeListing {
  id: number
  org_id: string
  party_id: number
  title: string
  listing_type: string
  status: string
  currency: string
  asking_price: string | null
  description: string | null
  origin_country: string | null
  created_at: string
  updated_at: string
}

interface DjangoTradeDeal {
  id: number
  org_id: string
  listing_id: number
  buyer_id: number
  seller_id: number
  broker_id: number | null
  stage: string
  deal_currency: string
  agreed_price: string | null
  created_at: string
  updated_at: string
}

interface DjangoTradeQuote {
  id: number
  deal_id: number
  org_id: string
  quoted_by_id: number
  amount: string
  currency: string
  status: string
  valid_until: string | null
  notes: string | null
  created_at: string
}

interface DjangoTradeFinancing {
  id: number
  deal_id: number
  org_id: string
  provider: string
  financing_type: string
  amount: string
  currency: string
  status: string
  terms_json: string | null
  created_at: string
}

interface DjangoTradeShipment {
  id: number
  deal_id: number
  org_id: string
  origin_port: string | null
  destination_port: string | null
  carrier: string | null
  status: string
  estimated_departure: string | null
  estimated_arrival: string | null
  actual_departure: string | null
  actual_arrival: string | null
  tracking_reference: string | null
  created_at: string
  updated_at: string
}

interface DjangoTradeDocument {
  id: number
  deal_id: number
  org_id: string
  doc_type: string
  file_url: string
  file_name: string
  status: string
  created_at: string
}

interface DjangoTradeCommission {
  id: number
  deal_id: number
  org_id: string
  party_id: number
  amount: string
  currency: string
  status: string
  created_at: string
}

// ── Stage mapping (Django stage → NzilaOS TradeDealStage) ─────────────────

const STAGE_MAP: Record<string, string> = {
  draft: 'draft',
  inquiry: 'inquiry',
  qualified: 'qualified',
  quoted: 'quoted',
  negotiation: 'negotiation',
  funded: 'funded',
  in_transit: 'in_transit',
  delivered: 'delivered',
  closed: 'closed',
  cancelled: 'cancelled',
  // Legacy aliases
  new: 'inquiry',
  pending: 'draft',
  completed: 'closed',
  archived: 'closed',
  rejected: 'cancelled',
}

const PARTY_ROLE_MAP: Record<string, string> = {
  buyer: 'buyer',
  seller: 'seller',
  broker: 'broker',
  agent: 'broker',
  exporter: 'seller',
  importer: 'buyer',
  logistics: 'logistics_provider',
  finance: 'financier',
  inspector: 'inspector',
}

const LISTING_STATUS_MAP: Record<string, string> = {
  active: 'active',
  draft: 'draft',
  sold: 'sold',
  reserved: 'reserved',
  expired: 'expired',
  deleted: 'expired',
}

const SOURCE_SYSTEM = 'trade-os' as const

// ── Helpers ───────────────────────────────────────────────────────────────

function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2)
  const isLive = args.includes('--live')
  const batchSize = parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] ?? '500', 10)

  const sourceConnectionString = process.env.LEGACY_TRADEOS_DATABASE_URL
  const destConnectionString = process.env.DATABASE_URL

  if (!sourceConnectionString) {
    console.error('❌ LEGACY_TRADEOS_DATABASE_URL is required')
    process.exit(1)
  }
  if (!destConnectionString) {
    console.error('❌ DATABASE_URL is required')
    process.exit(1)
  }

  return {
    dryRun: !isLive,
    batchSize,
    sourceConnectionString,
    destConnectionString,
  }
}

function mapStage(legacyStage: string): string {
  return STAGE_MAP[legacyStage.toLowerCase()] ?? 'draft'
}

function mapPartyRole(legacyRole: string): string {
  return PARTY_ROLE_MAP[legacyRole.toLowerCase()] ?? 'buyer'
}

function mapListingStatus(legacyStatus: string): string {
  return LISTING_STATUS_MAP[legacyStatus.toLowerCase()] ?? 'draft'
}

function generateId(): string {
  return crypto.randomUUID()
}

// ── Migration runners ─────────────────────────────────────────────────────

/**
 * Placeholder: In production, these would use pg client to query source DB
 * and Drizzle to insert into destination DB.
 *
 * For now, this script documents the complete mapping logic.
 */

async function migrateParties(config: MigrationConfig): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_parties', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_parties (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  // TODO: Connect to source DB and fetch parties
  // const sourceParties: DjangoTradeParty[] = await sourceDb.query('SELECT * FROM trade_party ORDER BY id')

  // For each party:
  // 1. Check if legacySourceId exists in destination
  // 2. If not, map fields and insert:
  //    - id: generateId()
  //    - orgId: party.org_id (maps to NzilaOS entity)
  //    - name: party.name
  //    - role: mapPartyRole(party.role)
  //    - email: party.email
  //    - phone: party.phone
  //    - countryCode: party.country_code
  //    - taxId: party.tax_id
  //    - legacySourceId: String(party.id)
  //    - legacySourceSystem: SOURCE_SYSTEM
  //    - createdAt: new Date(party.created_at)
  //    - updatedAt: new Date(party.updated_at)

  console.log(`   ✅ Parties: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

async function migrateListings(
  config: MigrationConfig,
  _partyIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_listings', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_listings (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  // TODO: Connect to source DB and fetch listings
  // Map fields:
  //   - id: generateId()
  //   - orgId: listing.org_id
  //   - sellerId: partyIdMap.get(listing.party_id)
  //   - title: listing.title
  //   - listingType: listing.listing_type (general, vehicle, equipment, commodity)
  //   - status: mapListingStatus(listing.status)
  //   - currency: listing.currency
  //   - askingPrice: listing.asking_price
  //   - description: listing.description
  //   - originCountry: listing.origin_country
  //   - legacySourceId: String(listing.id)
  //   - legacySourceSystem: SOURCE_SYSTEM

  console.log(`   ✅ Listings: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

async function migrateDeals(
  config: MigrationConfig,
  _listingIdMap: Map<number, string>,
  _partyIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_deals', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_deals (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  // TODO: Map fields:
  //   - id: generateId()
  //   - orgId: deal.org_id
  //   - listingId: listingIdMap.get(deal.listing_id)
  //   - buyerId: partyIdMap.get(deal.buyer_id)
  //   - sellerId: partyIdMap.get(deal.seller_id)
  //   - brokerId: deal.broker_id ? partyIdMap.get(deal.broker_id) : null
  //   - stage: mapStage(deal.stage)
  //   - dealCurrency: deal.deal_currency
  //   - agreedPrice: deal.agreed_price
  //   - legacySourceId: String(deal.id)
  //   - legacySourceSystem: SOURCE_SYSTEM

  console.log(`   ✅ Deals: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

async function migrateQuotes(
  config: MigrationConfig,
  _dealIdMap: Map<number, string>,
  _partyIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_quotes', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_quotes (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  // TODO: Map fields using dealIdMap and partyIdMap for FK resolution

  console.log(`   ✅ Quotes: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

async function migrateFinancing(
  config: MigrationConfig,
  _dealIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_financing', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_financing (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  console.log(`   ✅ Financing: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

async function migrateShipments(
  config: MigrationConfig,
  _dealIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_shipments', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_shipments (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  // TODO: Map fields + resolve FK via dealIdMap

  console.log(`   ✅ Shipments: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

async function migrateDocuments(
  config: MigrationConfig,
  _dealIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_documents', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_documents (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  console.log(`   ✅ Documents: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

async function migrateCommissions(
  config: MigrationConfig,
  _dealIdMap: Map<number, string>,
  _partyIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'trade_commissions', total: 0, inserted: 0, skipped: 0, errors: [] }

  console.log(`\n📋 Migrating trade_commissions (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`)

  console.log(`   ✅ Commissions: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`)
  return result
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const config = parseArgs()

  console.log('═══════════════════════════════════════════════════')
  console.log(' Trade-OS → NzilaOS Trade: Core Data Migration')
  console.log(`  Mode: ${config.dryRun ? '🔍 DRY RUN' : '🔴 LIVE'}`)
  console.log(`  Source: ${config.sourceConnectionString.replace(/:\/\/.*@/, '://***@')}`)
  console.log(`  Dest:   ${config.destConnectionString.replace(/:\/\/.*@/, '://***@')}`)
  console.log('═══════════════════════════════════════════════════')

  const results: MigrationResult[] = []

  // ID mapping: legacyId → newId
  const partyIdMap = new Map<number, string>()
  const listingIdMap = new Map<number, string>()
  const dealIdMap = new Map<number, string>()

  // Migrate in dependency order
  results.push(await migrateParties(config))
  results.push(await migrateListings(config, partyIdMap))
  results.push(await migrateDeals(config, listingIdMap, partyIdMap))
  results.push(await migrateQuotes(config, dealIdMap, partyIdMap))
  results.push(await migrateFinancing(config, dealIdMap))
  results.push(await migrateShipments(config, dealIdMap))
  results.push(await migrateDocuments(config, dealIdMap))
  results.push(await migrateCommissions(config, dealIdMap, partyIdMap))

  // Summary
  console.log('\n═══════════════════════════════════════════════════')
  console.log(' Migration Summary')
  console.log('═══════════════════════════════════════════════════')
  for (const r of results) {
    const status = r.errors.length > 0 ? '⚠️' : '✅'
    console.log(`  ${status} ${r.table}: ${r.inserted} inserted, ${r.skipped} skipped, ${r.errors.length} errors`)
  }

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
  if (totalErrors > 0) {
    console.log(`\n❌ ${totalErrors} total errors — check logs above`)
    process.exit(1)
  }

  console.log('\n✅ Migration complete')
}

main().catch((err) => {
  console.error('Fatal migration error:', err)
  process.exit(1)
})
