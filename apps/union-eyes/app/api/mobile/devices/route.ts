/**
 * GET POST /api/mobile/devices
 * -> Django auth_core: /api/auth_core/devices/
 * NOTE: auto-resolved from mobile/devices
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/devices/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/devices/', { method: 'POST' });
}

