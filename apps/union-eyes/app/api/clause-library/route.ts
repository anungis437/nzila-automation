/**
 * GET POST /api/clause-library
 * -> Django bargaining: /api/bargaining/shared-clause-library/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/shared-clause-library/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/shared-clause-library/', { method: 'POST' });
}

