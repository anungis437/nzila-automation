import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/claims/[id]/defensibility-pack  Django GET /api/grievances/claims/{id}/defensibility-pack/ */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/grievances/claims/' + id + '/defensibility-pack/');
}

/** POST /api/claims/[id]/defensibility-pack  Django POST (generate AI pack) */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/grievances/claims/' + id + '/defensibility-pack/', { method: 'POST' });
}