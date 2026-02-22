/**
 * GET POST /api/documents/categories
 * -> Django content: /api/content/documents/
 * NOTE: auto-resolved from documents/categories
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/content/documents/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/content/documents/', { method: 'POST' });
}

