/**
 * GET POST /api/executive/dashboard
 * -> Django unions: /api/unions/federation-executives/
 * NOTE: auto-resolved from executive/dashboard
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/federation-executives/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/federation-executives/', { method: 'POST' });
}

