/**
 * GET POST /api/profile/roles
 * -> Django auth_core: /api/auth_core/profiles/
 * NOTE: auto-resolved from profile/roles
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/profiles/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/profiles/', { method: 'POST' });
}

