import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET  /api/members/[id]/preferences  Django GET  /api/auth_core/member-contact-preferences/?user_id={id} */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/member-contact-preferences/?user_id=' + id);
}

/** PATCH /api/members/[id]/preferences  Django PATCH /api/auth_core/member-contact-preferences/{id}/ */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/member-contact-preferences/' + id + '/', { method: 'PATCH' });
}