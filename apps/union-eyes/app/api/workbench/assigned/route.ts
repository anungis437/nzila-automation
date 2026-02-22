/**
 * GET POST /api/workbench/assigned
 * -> Django ai_core: /api/ai_core/knowledge-base/
 * NOTE: auto-resolved from workbench/assigned
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/ai_core/knowledge-base/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/ai_core/knowledge-base/', { method: 'POST' });
}

