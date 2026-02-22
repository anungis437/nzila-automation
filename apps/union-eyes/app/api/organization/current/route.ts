/**
 * GET POST /api/organization/current
 * -> Django auth_core: /api/auth_core/organization-members/
 * NOTE: auto-resolved from organization/current
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/', { method: 'POST' });
}

