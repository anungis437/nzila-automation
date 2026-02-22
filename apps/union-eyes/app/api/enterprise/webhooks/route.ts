/**
 * GET POST /api/enterprise/webhooks
 * -> Django auth_core: /api/auth_core/health/
 * NOTE: auto-resolved from enterprise/webhooks
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/health/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/health/', { method: 'POST' });
}

