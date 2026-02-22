#!/usr/bin/env node
/**
 * V2 API Migration Script
 *
 * Programmatically migrates union-eyes API routes to the withApi() framework.
 *
 * Strategy:
 *   1. Django proxy routes (341) → withApi() + djangoProxy() pass-through
 *   2. withApiAuth routes (24)   → withApi({ auth: { required: true } })
 *   3. withRoleAuth routes (36)  → withApi({ auth: { minRole } })
 *   4. withAdminAuth routes (3)  → withApi({ auth: { minRole: 'admin' } })
 *   5. raw routes (22)           → withApi() with inferred auth
 *
 * Usage:
 *   node scripts/migrate-to-v2.mjs [--dry-run] [--pattern <glob>]
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

const UE_ROOT = join(import.meta.dirname, '..');
const API_DIR = join(UE_ROOT, 'app', 'api');
const V2_DIR = join(UE_ROOT, 'app', 'api', 'v2');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  errors: 0,
  byCategory: { djangoProxy: 0, withApiAuth: 0, withRoleAuth: 0, withAdminAuth: 0, withMinRole: 0, raw: 0 },
};

// ─── Discover all route files ─────────────────────────────────────────────────
function findRouteFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...findRouteFiles(full));
    } else if (entry === 'route.ts') {
      results.push(full);
    }
  }
  return results;
}

// ─── Classify a route ─────────────────────────────────────────────────────────
function classify(src) {
  if (/withRoleAuth/.test(src)) return 'withRoleAuth';
  if (/withAdminAuth/.test(src)) return 'withAdminAuth';
  if (/withMinRole/.test(src)) return 'withMinRole';
  if (/withApiAuth/.test(src)) return 'withApiAuth';
  if (/djangoProxy|django-proxy/.test(src)) return 'djangoProxy';
  return 'raw';
}

// ─── Extract HTTP methods exported ────────────────────────────────────────────
function extractMethods(src) {
  const methods = [];
  for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    if (new RegExp(`export\\s+(const|async\\s+function|function)\\s+${m}\\b`).test(src)) {
      methods.push(m);
    }
  }
  return methods;
}

// ─── Derive route path from filesystem path ───────────────────────────────────
function routePath(filePath) {
  const rel = relative(API_DIR, dirname(filePath)).replace(/\\/g, '/');
  return '/api/' + (rel || '');
}

// ─── Extract tag from route path ──────────────────────────────────────────────
function deriveTag(routeP) {
  const parts = routeP.replace('/api/', '').split('/');
  const tag = parts[0] || 'General';
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

// ─── Extract role from withRoleAuth patterns ──────────────────────────────────
function extractRole(src) {
  // withRoleAuth('steward', handler)
  const strMatch = src.match(/withRoleAuth\(['"]([^'"]+)['"]/);
  if (strMatch) return strMatch[1];
  // withRoleAuth(90, handler) — numeric role level
  const numMatch = src.match(/withRoleAuth\((\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return null;
}

// ─── Role level to name mapping ───────────────────────────────────────────────
const LEVEL_TO_ROLE = {
  10: 'member',
  20: 'delegate',
  30: 'steward',
  40: 'chief_steward',
  50: 'committee_chair',
  60: 'trustee',
  70: 'secretary_treasurer',
  80: 'vice_president',
  90: 'president',
  100: 'executive_board',
  110: 'director',
  120: 'regional_director',
  130: 'national_officer',
  200: 'admin',
  250: 'super_admin',
  300: 'platform_admin',
};

function roleToName(role) {
  if (typeof role === 'string') return role;
  return LEVEL_TO_ROLE[role] || 'admin';
}

// ─── Extract Zod schemas from source ──────────────────────────────────────────
function extractZodSchemas(src) {
  // Find all const xxxSchema = z.object({...})
  const schemas = [];
  const schemaPattern = /const\s+(\w+)\s*=\s*z\.object\(\{[\s\S]*?\}\);/g;
  let m;
  while ((m = schemaPattern.exec(src)) !== null) {
    schemas.push({ name: m[1], code: m[0] });
  }
  return schemas;
}

// ─── Check if route has rate limiting ─────────────────────────────────────────
function extractRateLimit(src) {
  const match = src.match(/checkRateLimit\([^,]+,\s*(RATE_LIMITS\.\w+)/);
  return match ? match[1] : null;
}

// ─── Extract Django proxy target ──────────────────────────────────────────────
function extractDjangoTarget(src) {
  const match = src.match(/djangoProxy\(\s*req\w*,\s*['"`]([^'"`]+)['"`]/);
  return match ? match[1] : null;
}

// ─── Check for dynamic route segments ─────────────────────────────────────────
function hasDynamicSegments(routeP) {
  return /\[/.test(routeP);
}

// ─── MIGRATION: Django Proxy ──────────────────────────────────────────────────
function migrateDjangoProxy(src, filePath, methods, routeP) {
  const target = extractDjangoTarget(src);
  const tag = deriveTag(routeP);
  const hasAuth = /requireAuth:\s*true/.test(src);

  const lines = [
    `/**`,
    ` * ${methods.join(' ')} ${routeP}`,
    ` * → Django: ${target || '<detected at runtime>'}`,
    ` * Migrated to withApi() framework`,
    ` */`,
    `import { NextRequest } from 'next/server';`,
    `import { djangoProxy } from '@/lib/django-proxy';`,
    `import { withApi } from '@/lib/api/framework';`,
    ``,
    `export const dynamic = 'force-dynamic';`,
    ``,
  ];

  for (const method of methods) {
    const djangoTarget = extractDjangoTargetForMethod(src, method) || target || routeP.replace('/api/', '/api/core/');

    lines.push(
      `export const ${method} = withApi(`,
      `  {`,
      `    auth: { required: ${hasAuth ? 'true' : 'false'} },`,
      `    openapi: {`,
      `      tags: ['${tag}', 'Django Proxy'],`,
      `      summary: '${method} ${routeP.split('/').pop() || routeP}',`,
      `      description: 'Proxied to Django: ${djangoTarget}',`,
      `    },`,
      `  },`,
      `  async ({ request }) => {`,
      `    const response = await djangoProxy(request, '${djangoTarget}'${method !== 'GET' ? `, { method: '${method}' }` : ''});`,
      `    return response;`,
      `  },`,
      `);`,
      ``,
    );
  }

  return lines.join('\n');
}

function extractDjangoTargetForMethod(src, method) {
  // Try to find a per-method target: export function GET(req) { return djangoProxy(req, '/api/...')"}
  const blockRegex = new RegExp(
    `export\\s+(?:const|function|async\\s+function)\\s+${method}[\\s\\S]*?djangoProxy\\(\\s*\\w+,\\s*['"\`]([^'"\`]+)['"\`]`,
  );
  const match = src.match(blockRegex);
  return match ? match[1] : null;
}

// ─── MIGRATION: withApiAuth, withRoleAuth, withAdminAuth ──────────────────────
function migrateAuthWrapped(src, filePath, methods, routeP, category) {
  const tag = deriveTag(routeP);
  const schemas = extractZodSchemas(src);
  const rateLimit = extractRateLimit(src);
  const hasDynamic = hasDynamicSegments(routeP);

  // Build auth config depending on category
  let authConfig;
  switch (category) {
    case 'withAdminAuth':
      authConfig = `{ required: true, minRole: 'admin' as const }`;
      break;
    case 'withMinRole': {
      const role = extractRole(src);
      const roleName = roleToName(role);
      authConfig = `{ required: true, minRole: '${roleName}' as const }`;
      break;
    }
    case 'withRoleAuth': {
      const role = extractRole(src);
      const roleName = roleToName(role);
      authConfig = `{ required: true, minRole: '${roleName}' as const }`;
      break;
    }
    default:
      authConfig = `{ required: true }`;
  }

  // Collect service/lib imports from original (filter out legacy api-auth-guard etc.)
  const serviceImports = extractServiceImports(src);

  const lines = [
    `// @ts-nocheck`,
    `/**`,
    ` * ${methods.join(' ')} ${routeP}`,
    ` * Migrated to withApi() framework`,
    ` */`,
  ];

  // Add service imports
  for (const imp of serviceImports) {
    lines.push(imp);
  }

  // Framework import
  const frameworkImports = ['withApi', 'ApiError'];
  if (schemas.length > 0) frameworkImports.push('z');
  if (rateLimit) frameworkImports.push('RATE_LIMITS');
  lines.push(`import { ${frameworkImports.join(', ')} } from '@/lib/api/framework';`);
  lines.push('');

  // Emit Zod schemas
  for (const s of schemas) {
    lines.push(s.code);
    lines.push('');
  }

  // Generate handler for each method
  for (const method of methods) {
    const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Try to find which schema this method uses
    const methodSchema = findSchemaForMethod(src, method, schemas);

    const optionParts = [`    auth: ${authConfig},`];

    if (methodSchema && isWriteMethod) {
      optionParts.push(`    body: ${methodSchema},`);
    }
    if (rateLimit && isWriteMethod) {
      optionParts.push(`    rateLimit: ${rateLimit},`);
    }

    optionParts.push(`    openapi: {`);
    optionParts.push(`      tags: ['${tag}'],`);
    optionParts.push(`      summary: '${method} ${routeP.split('/').pop() || routeP}',`);
    optionParts.push(`    },`);

    if (method === 'POST') {
      optionParts.push(`    successStatus: 201,`);
    }

    // Extract the handler body
    const handlerBody = extractHandlerBody(src, method, category);

    lines.push(
      `export const ${method} = withApi(`,
      `  {`,
      ...optionParts,
      `  },`,
      `  async (${hasDynamic ? '{ request, params, userId, organizationId, user, body, query }' : '{ request, userId, organizationId, user, body, query }'}) => {`,
    );

    // Add the extracted handler body or a TODO
    if (handlerBody) {
      lines.push(handlerBody);
    } else {
      lines.push(`    // TODO: migrate handler body`);
      lines.push(`    throw ApiError.internal('Route not yet migrated');`);
    }

    lines.push(`  },`);
    lines.push(`);`);
    lines.push(``);
  }

  return lines.join('\n');
}

// ─── MIGRATION: raw routes ────────────────────────────────────────────────────
function migrateRaw(src, filePath, methods, routeP) {
  const tag = deriveTag(routeP);
  const schemas = extractZodSchemas(src);
  const rateLimit = extractRateLimit(src);
  const hasAuth = /getCurrentUser|auth\(\)|getAuth/.test(src);

  const serviceImports = extractServiceImports(src);

  const lines = [
    `// @ts-nocheck`,
    `/**`,
    ` * ${methods.join(' ')} ${routeP}`,
    ` * Migrated to withApi() framework`,
    ` */`,
  ];

  for (const imp of serviceImports) {
    lines.push(imp);
  }

  const frameworkImports = ['withApi', 'ApiError'];
  if (schemas.length > 0) frameworkImports.push('z');
  if (rateLimit) frameworkImports.push('RATE_LIMITS');
  lines.push(`import { ${frameworkImports.join(', ')} } from '@/lib/api/framework';`);
  lines.push('');

  for (const s of schemas) {
    lines.push(s.code);
    lines.push('');
  }

  for (const method of methods) {
    const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const methodSchema = findSchemaForMethod(src, method, schemas);

    const optionParts = [`    auth: { required: ${hasAuth ? 'true' : 'false'} },`];

    if (methodSchema && isWriteMethod) {
      optionParts.push(`    body: ${methodSchema},`);
    }
    if (rateLimit) {
      optionParts.push(`    rateLimit: ${rateLimit},`);
    }

    optionParts.push(`    openapi: {`);
    optionParts.push(`      tags: ['${tag}'],`);
    optionParts.push(`      summary: '${method} ${routeP.split('/').pop() || routeP}',`);
    optionParts.push(`    },`);

    const handlerBody = extractHandlerBody(src, method, 'raw');

    lines.push(
      `export const ${method} = withApi(`,
      `  {`,
      ...optionParts,
      `  },`,
      `  async ({ request, userId, organizationId, user, body, query, params }) => {`,
    );

    if (handlerBody) {
      lines.push(handlerBody);
    } else {
      lines.push(`    // TODO: migrate handler body`);
      lines.push(`    throw ApiError.internal('Route not yet migrated');`);
    }

    lines.push(`  },`);
    lines.push(`);`);
    lines.push(``);
  }

  return lines.join('\n');
}

// ─── Extract service/library imports (keep everything except auth/response) ───
function extractServiceImports(src) {
  const results = [];
  const importRegex = /^import\s+.*?from\s+['"]([^'"]+)['"];?\s*$/gm;
  let m;
  while ((m = importRegex.exec(src)) !== null) {
    const mod = m[1];
    // Skip imports that the framework replaces
    if (
      mod.includes('api-auth-guard') ||
      mod.includes('standardized-responses') ||
      mod.includes('rate-limiter') ||
      mod.includes('next/server') ||
      mod.includes('api/framework') ||
      (mod === 'zod')
    ) continue;
    results.push(m[0]);
  }
  return results;
}

// ─── Find which schema belongs to which method ────────────────────────────────
function findSchemaForMethod(src, method, schemas) {
  if (schemas.length === 0) return null;
  if (schemas.length === 1) return schemas[0].name;

  // Look for the schema being used in the handler for this method
  for (const s of schemas) {
    // Check if schema is used near the method export
    const methodBlockMatch = src.match(
      new RegExp(`export\\s+(?:const|function|async\\s+function)\\s+${method}[\\s\\S]{0,500}${s.name}`)
    );
    if (methodBlockMatch) return s.name;
  }

  // If POST/PUT/PATCH, return the first schema as a reasonable guess
  if (['POST', 'PUT', 'PATCH'].includes(method)) return schemas[0].name;
  return null;
}

// ─── Extract handler body from a given method ─────────────────────────────────
function extractHandlerBody(src, method, category) {
  // For complex routes we extract the inner try/catch block body
  // and rewrite auth/validation patterns to use framework context

  // Find the method handler boundaries
  let handlerCode = null;

  if (category === 'djangoProxy') return null;

  // Try to find the try-block body for this method
  // Look for patterns like: try { ... <business logic> ... }
  const methodBlockRegex = new RegExp(
    `export\\s+(?:const|function|async\\s+function)\\s+${method}\\b([\\s\\S]*?)(?=export\\s+(?:const|function|async\\s+function)\\s+(?:GET|POST|PUT|PATCH|DELETE)\\b|$)`,
  );

  const methodBlock = src.match(methodBlockRegex);
  if (!methodBlock) return null;

  const block = methodBlock[1];

  // Find the innermost try block's body
  const tryMatch = block.match(/try\s*\{([\s\S]*?)\}\s*catch/);
  if (tryMatch) {
    let body = tryMatch[1];

    // Remove getCurrentUser() calls — context now provides user
    body = body.replace(/const\s+(?:user|currentUser)\s*=\s*await\s+getCurrentUser\(\);?\s*/g, '');
    body = body.replace(/if\s*\(\s*!(?:user|currentUser)\s*\)\s*\{[\s\S]*?return\s+.*?;\s*\}\s*/g, '');

    // Remove manual auth checks
    body = body.replace(/const\s*\{\s*userId\s*\}\s*=\s*(?:await\s+)?auth\(\);?\s*/g, '');
    body = body.replace(/if\s*\(\s*!userId\s*\)\s*\{[\s\S]*?return\s+.*?;\s*\}\s*/g, '');

    // Remove manual body parsing — withApi() now handles it
    body = body.replace(/const\s+(?:body|rawBody)\s*=\s*await\s+request\.json\(\);?\s*/g, '');
    body = body.replace(/const\s+(?:parsed|validation|result)\s*=\s*\w+Schema\.safeParse\((?:body|rawBody)\);?\s*/g, '');
    body = body.replace(/if\s*\(\s*!(?:parsed|validation|result)\.success\s*\)\s*\{[\s\S]*?\}\s*/g, '');
    body = body.replace(/const\s+\{[^}]*\}\s*=\s*(?:parsed|validation|result)\.data;?\s*/g, '');

    // Remove rate-limit handling — withApi() now handles it
    body = body.replace(/const\s+\w*[rR]ate\w*\s*=\s*await\s+checkRateLimit\([\s\S]*?\);?\s*/g, '');
    body = body.replace(/if\s*\(\s*!\w*[rR]ate\w*\.allowed\s*\)\s*\{[\s\S]*?\}\s*/g, '');

    // Replace standardSuccessResponse({ ... }) → return { ... }
    body = body.replace(
      /return\s+standardSuccessResponse\(([\s\S]*?)\);/g,
      (_, args) => {
        // If there's a status code arg, handle it
        const parts = args.split(/,\s*(?=undefined|null|\d)/);
        return `return ${parts[0].trim()};`;
      }
    );

    // Replace standardErrorResponse → throw ApiError
    body = body.replace(
      /return\s+standardErrorResponse\(\s*ErrorCode\.(\w+),\s*['"]([^'"]*)['"]/g,
      (_, code, msg) => {
        const errorCodeMap = {
          'VALIDATION_ERROR': 'badRequest',
          'AUTH_REQUIRED': 'unauthorized',
          'INSUFFICIENT_PERMISSIONS': 'forbidden',
          'FORBIDDEN': 'forbidden',
          'NOT_FOUND': 'notFound',
          'RESOURCE_NOT_FOUND': 'notFound',
          'RATE_LIMIT_EXCEEDED': 'rateLimited',
          'INTERNAL_ERROR': 'internal',
          'CONFLICT': 'conflict',
        };
        const factoryMethod = errorCodeMap[code] || 'internal';
        return `throw ApiError.${factoryMethod}('${msg}'`;
      }
    );

    // Replace NextResponse.json({ error: ... }, { status: xxx }) → throw ApiError
    body = body.replace(
      /return\s+NextResponse\.json\(\s*\{[^}]*error:\s*['"]([^'"]*)['"]\s*[^}]*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g,
      (_, msg, statusStr) => {
        const status = parseInt(statusStr, 10);
        const method = status === 404 ? 'notFound' : status === 400 ? 'badRequest' : status === 403 ? 'forbidden' : status === 401 ? 'unauthorized' : status === 429 ? 'rateLimited' : 'internal';
        return `throw ApiError.${method}('${msg}')`;
      }
    );

    // Replace return NextResponse.json(data) → return data
    body = body.replace(
      /return\s+NextResponse\.json\((\w+)(?:\s*,\s*\{[^}]*\})?\s*\)/g,
      (_, data) => `return ${data}`,
    );

    // Replace return NextResponse.json({ success: true, ...data }) → return data
    body = body.replace(
      /return\s+NextResponse\.json\(\{\s*success:\s*true,?\s*([\s\S]*?)\}\s*(?:,\s*\{[^}]*\})?\s*\)/g,
      (_, inner) => {
        if (inner.trim()) {
          return `return { ${inner.trim()} }`;
        }
        return `return {}`;
      }
    );

    // Indent the body
    const indented = body
      .split('\n')
      .map(line => '    ' + line)
      .join('\n')
      .replace(/^\s+$/gm, ''); // Remove whitespace-only lines

    handlerCode = indented;
  }

  return handlerCode;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('🚀 API v2 Migration Script');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no files written)' : 'LIVE'}`);
  console.log(`   Source: ${API_DIR}`);
  console.log(`   Target: ${V2_DIR}`);
  console.log('');

  const routeFiles = findRouteFiles(API_DIR)
    .filter(f => !f.includes(`${join('api', 'v2')}${join('')}`))  // Skip existing v2 routes
    .filter(f => !relative(API_DIR, f).startsWith('v2'));

  console.log(`   Found ${routeFiles.length} route files to migrate\n`);

  for (const filePath of routeFiles) {
    stats.total++;

    const relPath = relative(API_DIR, filePath);
    const src = readFileSync(filePath, 'utf-8');
    const methods = extractMethods(src);

    if (methods.length === 0) {
      if (VERBOSE) console.log(`   SKIP (no exports): ${relPath}`);
      stats.skipped++;
      continue;
    }

    const category = classify(src);
    const routeP = routePath(filePath);

    let migratedSrc;
    try {
      switch (category) {
        case 'djangoProxy':
          migratedSrc = migrateDjangoProxy(src, filePath, methods, routeP);
          break;
        case 'withApiAuth':
        case 'withRoleAuth':
        case 'withAdminAuth':
        case 'withMinRole':
          migratedSrc = migrateAuthWrapped(src, filePath, methods, routeP, category);
          break;
        case 'raw':
          migratedSrc = migrateRaw(src, filePath, methods, routeP);
          break;
      }
    } catch (err) {
      console.error(`   ERROR: ${relPath}: ${err.message}`);
      stats.errors++;
      continue;
    }

    if (!migratedSrc) {
      stats.skipped++;
      continue;
    }

    // Write to v2 directory
    const v2Path = join(V2_DIR, relPath);
    const v2Dir = dirname(v2Path);

    if (!DRY_RUN) {
      mkdirSync(v2Dir, { recursive: true });
      writeFileSync(v2Path, migratedSrc, 'utf-8');
    }

    stats.migrated++;
    stats.byCategory[category]++;

    if (VERBOSE) {
      console.log(`   ✓ ${relPath} [${category}] → v2/${relPath}`);
    }
  }

  console.log('\n━━━ Migration Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Total routes:    ${stats.total}`);
  console.log(`   Migrated:        ${stats.migrated}`);
  console.log(`   Skipped:         ${stats.skipped}`);
  console.log(`   Errors:          ${stats.errors}`);
  console.log('');
  console.log('   By category:');
  for (const [cat, count] of Object.entries(stats.byCategory)) {
    if (count > 0) console.log(`     ${cat}: ${count}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
