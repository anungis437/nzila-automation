/**
 * GET POST /api/consent
 * -> Django compliance: /api/compliance/consent-records/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/consent-records/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/consent-records/', { method: 'POST' });
}

