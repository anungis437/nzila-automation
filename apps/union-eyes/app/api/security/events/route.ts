/**
 * GET POST /api/security/events
 * -> Django core: /api/core/security-events/
 * NOTE: auto-resolved from security/events
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/core/security-events/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/core/security-events/', { method: 'POST' });
}

