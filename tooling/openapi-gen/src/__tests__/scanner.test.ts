import { describe, it, expect } from 'vitest';
import { scanNextjsApp, scanFastifyApp } from '../scanner.js';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';

const TMP = join(import.meta.dirname ?? __dirname, '..', '..', '__test-fixtures__');

function setup() {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
  mkdirSync(TMP, { recursive: true });
}

function teardown() {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
}

describe('scanner', () => {
  describe('scanNextjsApp', () => {
    it('discovers a Next.js route file with exported methods', () => {
      setup();
      const appDir = join(TMP, 'my-app');
      const routeDir = join(appDir, 'app', 'api', 'users');
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(join(routeDir, 'route.ts'), `
import { NextResponse } from 'next/server';
import { z } from 'zod';

const UserSchema = z.object({ name: z.string() });

export async function GET() {
  return NextResponse.json({ ok: true, data: [] });
}

export async function POST(req: Request) {
  const body = UserSchema.safeParse(await req.json());
  return NextResponse.json({ ok: true, data: body });
}
`);

      const routes = scanNextjsApp(appDir, 'my-app');
      expect(routes).toHaveLength(1);
      expect(routes[0]!.path).toBe('/api/users');
      expect(routes[0]!.methods).toEqual(expect.arrayContaining(['get', 'post']));
      expect(routes[0]!.hasZodSchemas).toBe(true);
      expect(routes[0]!.hasWithApi).toBe(false);

      teardown();
    });

    it('converts dynamic segments to OpenAPI path params', () => {
      setup();
      const appDir = join(TMP, 'dyn-app');
      const routeDir = join(appDir, 'app', 'api', 'users', '[id]', 'posts', '[postId]');
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(join(routeDir, 'route.ts'), `
export async function GET() { return Response.json({}); }
`);

      const routes = scanNextjsApp(appDir, 'dyn-app');
      expect(routes).toHaveLength(1);
      expect(routes[0]!.openApiPath).toBe('/api/users/{id}/posts/{postId}');

      teardown();
    });

    it('returns empty for an app with no api directory', () => {
      setup();
      const appDir = join(TMP, 'no-api');
      mkdirSync(appDir, { recursive: true });

      const routes = scanNextjsApp(appDir, 'no-api');
      expect(routes).toHaveLength(0);

      teardown();
    });
  });

  describe('scanFastifyApp', () => {
    it('discovers Fastify route registrations', () => {
      setup();
      const appDir = join(TMP, 'fastify-app');
      const routesDir = join(appDir, 'src', 'routes');
      mkdirSync(routesDir, { recursive: true });

      writeFileSync(join(routesDir, 'health.ts'), `
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function (app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));
  app.post('/commands', async (req) => ({ ok: true }));
}
`);

      const routes = scanFastifyApp(appDir, 'fastify-app');
      expect(routes.length).toBeGreaterThanOrEqual(1);
      // Should find /health and /commands
      const paths = routes.map(r => r.path);
      expect(paths).toContain('/health');

      teardown();
    });
  });
});
