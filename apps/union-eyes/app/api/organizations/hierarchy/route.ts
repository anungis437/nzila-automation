import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET /api/organizations/hierarchy  Django GET /api/unions/hierarchy/ */
export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/hierarchy/');
}