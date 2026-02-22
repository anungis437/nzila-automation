/**
 * GET POST /api/equity/self-identify
 * -> Django unions: /api/unions/member-segments/
 * NOTE: auto-resolved from equity/self-identify
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/member-segments/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/member-segments/', { method: 'POST' });
}

