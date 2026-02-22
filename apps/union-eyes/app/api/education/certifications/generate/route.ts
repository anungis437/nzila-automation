/**
 * GET POST /api/education/certifications/generate
 * -> Django unions: /api/unions/training-courses/
 * NOTE: auto-resolved from education/certifications/generate
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/training-courses/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/training-courses/', { method: 'POST' });
}

