/**
 * GET POST /api/ml/monitoring/usage
 * -> Django ai_core: /api/ai_core/ml-predictions/
 * NOTE: auto-resolved from ml/monitoring/usage
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/ai_core/ml-predictions/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/ai_core/ml-predictions/', { method: 'POST' });
}

