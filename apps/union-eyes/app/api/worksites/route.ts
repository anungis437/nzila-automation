/**
 * GET POST /api/worksites
 * -> Django unions: /api/unions/worksites/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/worksites/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/worksites/', { method: 'POST' });
}

