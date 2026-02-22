import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET  /api/organizations  Django GET /api/auth_core/organizations/ */
export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organizations/');
}

/** POST /api/organizations  Django POST /api/auth_core/organizations/ */
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organizations/', { method: 'POST' });
}