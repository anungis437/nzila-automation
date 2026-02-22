/**
 * GET POST /api/portal/dues/balance
 * -> Django content: /api/content/cms-pages/
 * NOTE: auto-resolved from portal/dues/balance
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/content/cms-pages/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/content/cms-pages/', { method: 'POST' });
}

