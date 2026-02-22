/**
 * GET POST /api/strike/disbursements
 * -> Django unions: /api/unions/voting-sessions/
 * NOTE: auto-resolved from strike/disbursements
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/voting-sessions/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/voting-sessions/', { method: 'POST' });
}

