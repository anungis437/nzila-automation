/**
 * GET POST /api/governance/policies/rules
 * -> Django compliance: /api/compliance/data-classification-policy/
 * NOTE: auto-resolved from governance/policies/rules
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/data-classification-policy/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/compliance/data-classification-policy/', { method: 'POST' });
}

