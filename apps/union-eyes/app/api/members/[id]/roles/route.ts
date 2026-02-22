import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET  /api/members/[id]/roles  Django GET  /api/auth_core/organization-members/?user_id={id} */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/organization-members/?user_id=' + id);
}

/** POST /api/members/[id]/roles  Django POST /api/auth_core/organization-members/ */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/organization-members/', {
    method: 'POST',
    extraHeaders: { 'X-Member-Id': id },
  });
}