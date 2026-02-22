/**
 * GET POST /api/integrations/api-keys
 * -> Django auth_core: /api/auth_core/oauth-providers/
 * NOTE: auto-resolved from integrations/api-keys
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/oauth-providers/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/oauth-providers/', { method: 'POST' });
}

