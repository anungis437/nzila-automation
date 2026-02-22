import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/members/[id]/history  Django GET /api/auth_core/member-history-events/?user_id={id} */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/auth_core/member-history-events/?user_id=' + id);
}