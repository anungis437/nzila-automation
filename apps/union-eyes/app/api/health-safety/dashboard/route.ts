/**
 * GET POST /api/health-safety/dashboard
 * -> Django compliance: /api/compliance/data-classification-policy/
 * NOTE: auto-resolved from health-safety/dashboard
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/data-classification-policy/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/data-classification-policy/', { method: 'POST' });
}

