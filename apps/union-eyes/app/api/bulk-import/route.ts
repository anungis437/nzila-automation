/**
 * POST /api/bulk-import
 * -> Django auth_core: /api/auth_core/organization-members/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/', { method: 'POST' });
}

