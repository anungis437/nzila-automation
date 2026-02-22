/**
 * GET POST /api/storage/usage
 * -> Django content: /api/content/cms-media-library/
 * NOTE: auto-resolved from storage/usage
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/content/cms-media-library/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/content/cms-media-library/', { method: 'POST' });
}

