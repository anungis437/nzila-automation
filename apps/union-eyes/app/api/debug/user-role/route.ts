/**
 * GET POST /api/debug/user-role
 * -> Django auth_core: /api/auth_core/user-role/
 * NOTE: auto-resolved from debug/user-role
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/user-role/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/user-role/', { method: 'POST' });
}

