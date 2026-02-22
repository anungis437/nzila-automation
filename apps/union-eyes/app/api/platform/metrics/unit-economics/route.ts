/**
 * GET POST /api/platform/metrics/unit-economics
 * -> Django auth_core: /api/auth_core/metrics/
 * NOTE: auto-resolved from platform/metrics/unit-economics
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/metrics/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/metrics/', { method: 'POST' });
}

