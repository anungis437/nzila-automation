import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/members/[id]/employment  Django GET /api/unions/member-employment/?user_id={id} */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/unions/member-employment/?user_id=' + id);
}

/** PATCH /api/members/[id]/employment  Django PATCH /api/unions/member-employment/{id}/ */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/member-employment-details/' + id + '/', { method: 'PATCH' });
}