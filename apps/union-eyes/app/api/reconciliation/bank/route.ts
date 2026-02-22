/**
 * GET POST /api/reconciliation/bank
 * -> Django billing: /api/billing/remittance-approvals/
 * NOTE: auto-resolved from reconciliation/bank
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/billing/remittance-approvals/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/billing/remittance-approvals/', { method: 'POST' });
}

