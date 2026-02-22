/**
 * GET POST /api/stewards
 * -> Django unions: /api/unions/steward-assignments/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/steward-assignments/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/steward-assignments/', { method: 'POST' });
}

