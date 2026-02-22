/**
 * GET POST /api/organizing/workplace-mapping
 * -> Django unions: /api/unions/organizing-campaigns/
 * NOTE: auto-resolved from organizing/workplace-mapping
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/organizing-campaigns/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/organizing-campaigns/', { method: 'POST' });
}

