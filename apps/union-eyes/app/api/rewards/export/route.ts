/**
 * GET /api/rewards/export
 * -> Django unions: /api/unions/recognition-awards/
 * NOTE: auto-resolved from rewards/export
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/recognition-awards/');
}

