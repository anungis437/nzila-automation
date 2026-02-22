/**
 * GET POST /api/organizer/impact
 * -> Django unions: /api/unions/organizer-tasks/
 * NOTE: auto-resolved from organizer/impact
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/organizer-tasks/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/organizer-tasks/', { method: 'POST' });
}

