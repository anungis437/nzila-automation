import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/members/[id]   Django GET /api/auth_core/organization-members/?user_id={id} */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/organization-members/', {
    extraHeaders: { 'X-Filter-User-Id': id },
  });
}

/** PATCH /api/members/[id]   Django PATCH /api/auth_core/organization-members/{id}/ */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/organization-members/' + id + '/', { method: 'PATCH' });
}

/** DELETE /api/members/[id]   Django DELETE /api/auth_core/organization-members/{id}/ */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/organization-members/' + id + '/', { method: 'DELETE' });
}