/**
 * GET POST /api/employers
 * -> Django unions: /api/unions/employers/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/employers/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/employers/', { method: 'POST' });
}

