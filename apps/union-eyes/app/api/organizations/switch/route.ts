import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** POST /api/organizations/switch  Django POST /api/auth_core/organization-members/switch/ */
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/switch/', { method: 'POST' });
}