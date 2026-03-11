/**
 * Shop Quoter — Demo Seed Data
 *
 * Creates demo org, users, workflow examples, and analytics data
 * for pilot demonstrations.
 */

export interface DemoOrg {
  id: string
  name: string
  tier: string
}

export interface DemoUser {
  id: string
  email: string
  role: string
  orgId: string
}

export interface DemoQuote {
  id: string
  orgId: string
  customerId: string
  status: string
  lines: Array<{ productId: string; description: string; quantity: number; unitPrice: number }>
  total: number
}

export function createDemoOrg(): DemoOrg {
  return { id: 'demo-org-quoter', name: 'Nzila Demo Quoter Corp', tier: 'PREMIUM' }
}

export function createDemoUsers(orgId: string): DemoUser[] {
  return [
    { id: 'demo-admin', email: 'admin@demo-quoter.nzila.io', role: 'admin', orgId },
    { id: 'demo-sales', email: 'sales@demo-quoter.nzila.io', role: 'sales', orgId },
    { id: 'demo-finance', email: 'finance@demo-quoter.nzila.io', role: 'finance', orgId },
  ]
}

export function createDemoQuotes(orgId: string): DemoQuote[] {
  return [
    {
      id: 'demo-quote-001',
      orgId,
      customerId: 'demo-customer-1',
      status: 'DRAFT',
      lines: [
        { productId: 'prod-a', description: 'Widget A', quantity: 100, unitPrice: 25 },
        { productId: 'prod-b', description: 'Widget B', quantity: 50, unitPrice: 75 },
      ],
      total: 6250,
    },
    {
      id: 'demo-quote-002',
      orgId,
      customerId: 'demo-customer-2',
      status: 'ACCEPTED',
      lines: [
        { productId: 'prod-c', description: 'Enterprise Package', quantity: 1, unitPrice: 15000 },
      ],
      total: 15000,
    },
    {
      id: 'demo-quote-003',
      orgId,
      customerId: 'demo-customer-3',
      status: 'SENT',
      lines: [
        { productId: 'prod-a', description: 'Widget A', quantity: 200, unitPrice: 22 },
      ],
      total: 4400,
    },
  ]
}

export function createDemoAnalytics() {
  return {
    quotesThisMonth: 47,
    conversionRate: 0.68,
    avgQuoteValue: 8500,
    topProducts: ['Widget A', 'Enterprise Package', 'Widget B'],
  }
}

export async function seedDemo() {
  const org = createDemoOrg()
  const users = createDemoUsers(org.id)
  const quotes = createDemoQuotes(org.id)
  const analytics = createDemoAnalytics()

  console.log(`[demo:seed] Shop Quoter demo data created`)
  console.log(`  Org: ${org.name}`)
  console.log(`  Users: ${users.length}`)
  console.log(`  Quotes: ${quotes.length}`)
  console.log(`  Analytics: ready`)

  return { org, users, quotes, analytics }
}

if (process.argv[1]?.includes('demoSeed')) {
  seedDemo().catch(console.error)
}
