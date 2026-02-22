/**
 * GET POST /api/gdpr/data-erasure
 * -> Django compliance: /api/compliance/dsr-requests/
 * NOTE: auto-resolved from gdpr/data-erasure
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/dsr-requests/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/dsr-requests/', { method: 'POST' });
}

