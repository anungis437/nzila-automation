/**
 * POST /api/upload
 * -> Django content: /api/content/cms-media-library/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/content/cms-media-library/', { method: 'POST' });
}

