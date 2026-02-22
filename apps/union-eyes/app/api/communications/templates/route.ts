/**
 * GET POST /api/communications/templates
 * -> Django notifications: /api/notifications/campaigns/
 * NOTE: auto-resolved from communications/templates
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/campaigns/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/campaigns/', { method: 'POST' });
}

