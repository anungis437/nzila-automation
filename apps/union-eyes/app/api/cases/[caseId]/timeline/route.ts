/**
 * GET /api/cases/[caseId]/timeline
 * -> Django grievances: /api/grievances/grievance-timeline/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/grievance-timeline/');
}

