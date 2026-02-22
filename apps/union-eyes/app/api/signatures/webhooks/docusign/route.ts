/**
 * GET POST /api/signatures/webhooks/docusign
 * -> Django content: /api/content/documents/
 * NOTE: auto-resolved from signatures/webhooks/docusign
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

