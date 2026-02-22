/**
 * GET POST /api/arbitration/precedents
 * -> Django bargaining: /api/bargaining/arbitration-decisions/
 * NOTE: auto-resolved from arbitration/precedents
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/arbitration-decisions/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/arbitration-decisions/', { method: 'POST' });
}

