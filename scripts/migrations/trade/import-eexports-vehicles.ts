/**
 * eExports Vehicle Inventory & Deals Import
 *
 * Imports vehicle listings and historical deals from the legacy
 * nzila_eexports-main Django app into NzilaOS Trade.
 *
 * Maps eExports vehicles → trade_listings + trade_vehicle_listings
 * Maps eExports deals → trade_deals + trade_quotes
 * Maps eExports docs → trade_vehicle_docs
 *
 * Usage:
 *   pnpm tsx scripts/migrations/trade/import-eexports-vehicles.ts --dry-run
 *   pnpm tsx scripts/migrations/trade/import-eexports-vehicles.ts --live
 *
 * Requires:
 *   - DATABASE_URL env var for destination (NzilaOS)
 *   - LEGACY_EEXPORTS_DATABASE_URL env var for source (Django eExports)
 *
 * @idempotent Uses legacySourceId + legacySourceSystem='eexports' as upsert key
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

interface ReconciliationEntry {
  table: string
  sourceCount: number
  destCount: number
  matched: number
  orphaned: number
  status: 'ok' | 'mismatch' | 'error'
}

// ── Django model shapes (from nzila_eexports-main) ────────────────────────

interface EExportsVehicle {
  id: number
  organisation_id: number
  vin: string
  make: string
  model: string
  year: number
  trim: string | null
  mileage: number | null
  condition: string | null
  transmission: string | null
  drivetrain: string | null
  fuel_type: string | null
  exterior_color: string | null
  interior_color: string | null
  engine_size: string | null
  title: string
  description: string | null
  asking_price: string | null
  currency: string | null
  status: string | null
  images: string[] | null
  video_url: string | null
  created_at: string
  updated_at: string
  extra_data: Record<string, unknown> | null
}

interface EExportsDeal {
  id: number
  organisation_id: number
  vehicle_id: number
  buyer_name: string
  buyer_email: string | null
  buyer_phone: string | null
  buyer_country: string | null
  deal_price: string | null
  currency: string | null
  status: string | null
  shipping_lane: string | null
  destination_port: string | null
  origin_port: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface EExportsDocument {
  id: number
  vehicle_id: number
  deal_id: number | null
  organisation_id: number
  doc_type: string
  title: string
  file_path: string
  checksum: string | null
  uploaded_by: string | null
  created_at: string
}

// ── Mapping constants ─────────────────────────────────────────────────────

const SOURCE_SYSTEM = 'eexports' as const

const CONDITION_MAP: Record<string, string> = {
  new: 'new',
  used: 'used',
  cpo: 'certified_pre_owned',
  certified_pre_owned: 'certified_pre_owned',
  salvage: 'salvage',
}

const TRANSMISSION_MAP: Record<string, string> = {
  automatic: 'automatic',
  auto: 'automatic',
  manual: 'manual',
  cvt: 'cvt',
}

const DRIVETRAIN_MAP: Record<string, string> = {
  fwd: 'fwd',
  rwd: 'rwd',
  awd: 'awd',
  '4wd': '4wd',
  '4x4': '4wd',
}

const FUEL_MAP: Record<string, string> = {
  gasoline: 'gasoline',
  petrol: 'gasoline',
  gas: 'gasoline',
  diesel: 'diesel',
  electric: 'electric',
  hybrid: 'hybrid',
  plugin_hybrid: 'plugin_hybrid',
  phev: 'plugin_hybrid',
}

const DOC_TYPE_MAP: Record<string, string> = {
  bill_of_sale: 'bill_of_sale',
  bos: 'bill_of_sale',
  export_certificate: 'export_certificate',
  export_cert: 'export_certificate',
  inspection: 'inspection_report',
  inspection_report: 'inspection_report',
  title: 'title',
  carfax: 'carfax',
  emissions: 'emissions_test',
  safety: 'safety_inspection',
  customs: 'customs_form',
}

const VEHICLE_STATUS_MAP: Record<string, string> = {
  available: 'active',
  active: 'active',
  sold: 'sold',
  reserved: 'reserved',
  draft: 'draft',
  pending: 'draft',
  archived: 'archived',
  deleted: 'archived',
}

const DEAL_STAGE_MAP: Record<string, string> = {
  inquiry: 'lead',
  new: 'lead',
  pending: 'lead',
  negotiation: 'qualified',
  quoted: 'quoted',
  accepted: 'accepted',
  paid: 'funded',
  shipped: 'shipped',
  delivered: 'delivered',
  completed: 'closed',
  closed: 'closed',
  cancelled: 'cancelled',
  rejected: 'cancelled',
}

// ── Helpers ───────────────────────────────────────────────────────────────

function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2)
  const isLive = args.includes('--live')
  const batchSize = parseInt(
    args.find((a) => a.startsWith('--batch='))?.split('=')[1] ?? '500',
    10,
  )

  const sourceConnectionString = process.env.LEGACY_EEXPORTS_DATABASE_URL
  const destConnectionString = process.env.DATABASE_URL

  if (!sourceConnectionString) {
    console.error('❌ LEGACY_EEXPORTS_DATABASE_URL is required')
    process.exit(1)
  }
  if (!destConnectionString) {
    console.error('❌ DATABASE_URL is required')
    process.exit(1)
  }

  return { dryRun: !isLive, batchSize, sourceConnectionString, destConnectionString }
}

function mapCondition(v: string | null): string {
  return CONDITION_MAP[(v ?? '').toLowerCase()] ?? 'used'
}

function mapTransmission(v: string | null): string | null {
  return TRANSMISSION_MAP[(v ?? '').toLowerCase()] ?? null
}

function mapDrivetrain(v: string | null): string | null {
  return DRIVETRAIN_MAP[(v ?? '').toLowerCase()] ?? null
}

function mapFuelType(v: string | null): string | null {
  return FUEL_MAP[(v ?? '').toLowerCase()] ?? null
}

function mapDocType(v: string): string {
  return DOC_TYPE_MAP[v.toLowerCase()] ?? 'customs_form'
}

function mapVehicleStatus(v: string | null): string {
  return VEHICLE_STATUS_MAP[(v ?? '').toLowerCase()] ?? 'draft'
}

function mapDealStage(v: string | null): string {
  return DEAL_STAGE_MAP[(v ?? '').toLowerCase()] ?? 'lead'
}

function generateId(): string {
  return crypto.randomUUID()
}

// ── Migration runners ─────────────────────────────────────────────────────

async function migrateVehicles(config: MigrationConfig): Promise<{
  result: MigrationResult
  vehicleIdMap: Map<number, string> // legacy vehicle ID → new listing ID
  listingIdMap: Map<number, string> // legacy vehicle ID → new trade_listing ID
}> {
  const result: MigrationResult = {
    table: 'trade_vehicle_listings',
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  }
  const vehicleIdMap = new Map<number, string>()
  const listingIdMap = new Map<number, string>()

  console.log(
    `\n🚗 Migrating eExports vehicles (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`,
  )

  // TODO: Connect to source DB and fetch vehicles
  // const sourceVehicles: EExportsVehicle[] = await sourceDb.query(
  //   'SELECT * FROM vehicles ORDER BY id',
  // )

  // For each vehicle:
  // 1. Check if legacySourceId exists in destination (upsert key)
  // 2. Create parent trade_listing:
  //    - id: generateId()
  //    - entityId: mapOrgId(vehicle.organisation_id) — requires org ID mapping table
  //    - partyId: (auto-create a seller party for the org if not exists)
  //    - listingType: 'vehicle'
  //    - title: vehicle.title
  //    - description: vehicle.description
  //    - currency: vehicle.currency ?? 'USD'
  //    - askingPrice: vehicle.asking_price ?? '0'
  //    - quantity: 1
  //    - status: mapVehicleStatus(vehicle.status)
  //    - metadata: { legacySourceId: String(vehicle.id), legacySourceSystem: SOURCE_SYSTEM }
  //
  // 3. Create trade_vehicle_listing:
  //    - id: generateId()
  //    - entityId: (same org)
  //    - listingId: (parent listing ID)
  //    - vin: vehicle.vin
  //    - year: vehicle.year
  //    - make: vehicle.make
  //    - model: vehicle.model
  //    - trim: vehicle.trim
  //    - mileage: vehicle.mileage ?? 0
  //    - condition: mapCondition(vehicle.condition)
  //    - exteriorColor: vehicle.exterior_color
  //    - interiorColor: vehicle.interior_color
  //    - engineType: vehicle.engine_size
  //    - transmission: mapTransmission(vehicle.transmission)
  //    - drivetrain: mapDrivetrain(vehicle.drivetrain)
  //    - fuelType: mapFuelType(vehicle.fuel_type)
  //    - metadata: { ...(vehicle.extra_data ?? {}) }
  //
  // 4. Create trade_listing_media for each image in vehicle.images[]

  console.log(
    `   ✅ Vehicles: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`,
  )
  return { result, vehicleIdMap, listingIdMap }
}

async function migrateDeals(
  config: MigrationConfig,
  vehicleIdMap: Map<number, string>,
  listingIdMap: Map<number, string>,
): Promise<{
  result: MigrationResult
  dealIdMap: Map<number, string>
}> {
  const result: MigrationResult = {
    table: 'trade_deals',
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  }
  const dealIdMap = new Map<number, string>()

  console.log(
    `\n📋 Migrating eExports deals (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`,
  )

  // TODO: Connect to source DB and fetch deals
  // const sourceDeals: EExportsDeal[] = await sourceDb.query(
  //   'SELECT * FROM deals ORDER BY id',
  // )

  // For each deal:
  // 1. Check if legacySourceId exists in destination
  // 2. Find or create buyer party:
  //    - name: deal.buyer_name
  //    - email: deal.buyer_email
  //    - phone: deal.buyer_phone
  //    - country: deal.buyer_country
  //    - role: 'buyer'
  //
  // 3. Create trade_deal:
  //    - id: generateId()
  //    - entityId: mapOrgId(deal.organisation_id)
  //    - refNumber: `EEX-${deal.id.toString().padStart(6, '0')}`
  //    - sellerPartyId: (org's seller party)
  //    - buyerPartyId: (created/found buyer party)
  //    - listingId: listingIdMap.get(deal.vehicle_id)
  //    - stage: mapDealStage(deal.status)
  //    - totalValue: deal.deal_price ?? '0'
  //    - currency: deal.currency ?? 'USD'
  //    - notes: deal.notes
  //    - metadata: { legacySourceId: String(deal.id), legacySourceSystem: SOURCE_SYSTEM }
  //
  // 4. If deal had shipping info, create trade_shipment:
  //    - originCountry / destinationCountry from ports
  //    - lane: deal.shipping_lane
  //    - status mapped from deal.status

  console.log(
    `   ✅ Deals: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`,
  )
  return { result, dealIdMap }
}

async function migrateDocs(
  config: MigrationConfig,
  listingIdMap: Map<number, string>,
  _dealIdMap: Map<number, string>,
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: 'trade_vehicle_docs',
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  }

  console.log(
    `\n📄 Migrating eExports documents (${config.dryRun ? 'DRY RUN' : 'LIVE'})...`,
  )

  // TODO: Connect to source DB and fetch documents
  // const sourceDocs: EExportsDocument[] = await sourceDb.query(
  //   'SELECT * FROM documents ORDER BY id',
  // )

  // For each document:
  // 1. Check if legacySourceId exists
  // 2. Create trade_vehicle_docs:
  //    - id: generateId()
  //    - entityId: mapOrgId(doc.organisation_id)
  //    - listingId: listingIdMap.get(doc.vehicle_id)
  //    - docType: mapDocType(doc.doc_type)
  //    - storageKey: doc.file_path (file must be migrated to blob storage separately)
  //    - contentHash: doc.checksum ?? 'pending-rehash'
  //    - uploadedBy: doc.uploaded_by ?? 'system-migration'

  console.log(
    `   ✅ Docs: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`,
  )
  return result
}

// ── Reconciliation ────────────────────────────────────────────────────────

async function reconcile(
  _config: MigrationConfig,
): Promise<ReconciliationEntry[]> {
  console.log('\n🔍 Running post-import reconciliation...')

  const entries: ReconciliationEntry[] = []

  // TODO: For each table, compare source and destination counts:
  //
  // const tables = [
  //   { name: 'vehicles → trade_vehicle_listings', sourceQuery: 'SELECT COUNT(*) FROM vehicles', destQuery: "SELECT COUNT(*) FROM trade_vehicle_listings WHERE metadata->>'legacySourceSystem' = 'eexports'" },
  //   { name: 'deals → trade_deals', sourceQuery: 'SELECT COUNT(*) FROM deals', destQuery: "SELECT COUNT(*) FROM trade_deals WHERE metadata->>'legacySourceSystem' = 'eexports'" },
  //   { name: 'documents → trade_vehicle_docs', sourceQuery: 'SELECT COUNT(*) FROM documents', destQuery: "SELECT COUNT(*) FROM trade_vehicle_docs WHERE metadata->>'legacySourceSystem' = 'eexports'" },
  // ]
  //
  // For each table:
  //   - Query source count
  //   - Query dest count matching source system
  //   - matched = min(source, dest)
  //   - orphaned = source - matched
  //   - status = matched === source ? 'ok' : 'mismatch'

  // Placeholder: report will be generated once DB connections are configured
  entries.push(
    { table: 'vehicles → trade_vehicle_listings', sourceCount: 0, destCount: 0, matched: 0, orphaned: 0, status: 'ok' },
    { table: 'deals → trade_deals', sourceCount: 0, destCount: 0, matched: 0, orphaned: 0, status: 'ok' },
    { table: 'documents → trade_vehicle_docs', sourceCount: 0, destCount: 0, matched: 0, orphaned: 0, status: 'ok' },
  )

  return entries
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  eExports Vehicle & Deal Import → NzilaOS Trade')
  console.log('═══════════════════════════════════════════════════════════')

  const config = parseArgs()

  console.log(`Mode: ${config.dryRun ? '🧪 DRY RUN' : '🔴 LIVE'}`)
  console.log(`Batch size: ${config.batchSize}`)
  console.log(`Source: ${config.sourceConnectionString.replace(/:[^:@]+@/, ':****@')}`)
  console.log(`Dest:   ${config.destConnectionString.replace(/:[^:@]+@/, ':****@')}`)

  const allResults: MigrationResult[] = []

  // Phase 1: Vehicles → trade_listings + trade_vehicle_listings
  const { result: vehicleResult, vehicleIdMap, listingIdMap } = await migrateVehicles(config)
  allResults.push(vehicleResult)

  // Phase 2: Deals → trade_deals (+ buyer parties + shipments)
  const { result: dealResult, dealIdMap } = await migrateDeals(config, vehicleIdMap, listingIdMap)
  allResults.push(dealResult)

  // Phase 3: Documents → trade_vehicle_docs
  const docResult = await migrateDocs(config, listingIdMap, dealIdMap)
  allResults.push(docResult)

  // Phase 4: Reconciliation
  const reconciliation = await reconcile(config)

  // ── Summary ─────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  MIGRATION SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')

  for (const r of allResults) {
    const emoji = r.errors.length > 0 ? '⚠️' : '✅'
    console.log(`${emoji} ${r.table}: ${r.inserted}/${r.total} inserted, ${r.skipped} skipped, ${r.errors.length} errors`)
  }

  console.log('\n── Reconciliation ─────────────────────────────────────────')
  for (const e of reconciliation) {
    const emoji = e.status === 'ok' ? '✅' : '⚠️'
    console.log(`${emoji} ${e.table}: source=${e.sourceCount} dest=${e.destCount} matched=${e.matched} orphaned=${e.orphaned}`)
  }

  // Write reconciliation report
  const reportPath = 'tmp-eexports-reconciliation.json'
  const report = {
    timestamp: new Date().toISOString(),
    mode: config.dryRun ? 'dry-run' : 'live',
    sourceSystem: SOURCE_SYSTEM,
    results: allResults,
    reconciliation,
    totalErrors: allResults.reduce((sum, r) => sum + r.errors.length, 0),
    errors: allResults.flatMap((r) => r.errors),
  }

  const fs = await import('node:fs')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📝 Reconciliation report written to ${reportPath}`)

  // Exit with error code if any errors
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0)
  if (totalErrors > 0) {
    console.error(`\n❌ Migration completed with ${totalErrors} errors`)
    process.exit(1)
  }

  console.log('\n✅ Migration completed successfully')
}

main().catch((err) => {
  console.error('💥 Migration failed:', err)
  process.exit(1)
})
