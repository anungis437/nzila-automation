import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/members/[id]/claims   Django GET /api/grievances/claims/?member_id={id} */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/grievances/claims/?member_id=' + id);
}

/** POST /api/members/[id]/claims   Django POST /api/grievances/claims/ */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return djangoProxy(req, '/api/grievances/claims/', {
    method: 'POST',
    extraHeaders: { 'X-Member-Id': id },
  });
}