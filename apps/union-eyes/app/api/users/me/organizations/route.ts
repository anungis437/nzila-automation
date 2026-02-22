/**
 * GET /api/users/me/organizations
 * -> Django auth_core: /api/auth_core/organization-members/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/');
}

