/**
 * GET POST /api/clauses/search
 * -> Django bargaining: /api/bargaining/cba-clauses/
 * NOTE: auto-resolved from clauses/search
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/cba-clauses/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/cba-clauses/', { method: 'POST' });
}

