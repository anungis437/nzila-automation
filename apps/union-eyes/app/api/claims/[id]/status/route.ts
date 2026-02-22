import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/claims/[id]/status  Django PATCH /api/grievances/claims/{id}/status/ */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/grievances/claims/' + id + '/status/', { method: 'PATCH' });
}