import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET  /api/claims  Django GET /api/grievances/claims/ */
export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/claims/');
}

/** POST /api/claims  Django POST /api/grievances/claims/ */
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/claims/', { method: 'POST' });
}