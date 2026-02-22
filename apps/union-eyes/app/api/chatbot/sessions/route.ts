/**
 * GET POST /api/chatbot/sessions
 * -> Django ai_core: /api/ai_core/chat-sessions/
 * NOTE: auto-resolved from chatbot/sessions
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/ai_core/chat-sessions/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/ai_core/chat-sessions/', { method: 'POST' });
}

