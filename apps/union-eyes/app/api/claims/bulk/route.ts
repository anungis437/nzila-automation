import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** POST /api/claims/bulk  Django POST /api/grievances/claims/bulk/ */
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/claims/bulk/', { method: 'POST' });
}