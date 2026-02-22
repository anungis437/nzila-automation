/**
 * GET POST /api/enterprise/dsr/requests
 * -> Django auth_core: /api/auth_core/dsr/
 * NOTE: auto-resolved from enterprise/dsr/requests
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/dsr/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/dsr/', { method: 'POST' });
}

