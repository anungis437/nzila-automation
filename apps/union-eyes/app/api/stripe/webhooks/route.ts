/**
 * GET POST /api/stripe/webhooks
 * -> Django billing: /api/billing/stripe-connect-accounts/
 * NOTE: auto-resolved from stripe/webhooks
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/billing/stripe-connect-accounts/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/billing/stripe-connect-accounts/', { method: 'POST' });
}

