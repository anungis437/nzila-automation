/**
 * GET POST /api/enterprise/sso/providers
 * -> Django auth_core: /api/auth_core/sso/
 * NOTE: auto-resolved from enterprise/sso/providers
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/sso/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/sso/', { method: 'POST' });
}

