/**
 * GET POST /api/clause-library/search
 * -> Django bargaining: /api/bargaining/shared-clause-library/
 * NOTE: auto-resolved from clause-library/search
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

