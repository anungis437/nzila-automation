/**
 * GET POST /api/user/status
 * -> Django auth_core: /api/auth_core/users/
 * NOTE: auto-resolved from user/status
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/users/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/users/', { method: 'POST' });
}

