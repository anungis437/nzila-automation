/**
 * @nzila/openapi-gen — Types for the OpenAPI generation pipeline
 */

import type { z } from 'zod';

/** HTTP methods we care about */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** A discovered API route from static analysis */
export interface DiscoveredRoute {
  /** Absolute file path */
  filePath: string;
  /** App name (e.g. 'web', 'union-eyes') */
  app: string;
  /** API path (e.g. '/api/deals', '/api/v2/extensions/[id]') */
  path: string;
  /** OpenAPI-style path (e.g. '/api/deals', '/api/v2/extensions/{id}') */
  openApiPath: string;
  /** HTTP methods exported from the route file */
  methods: HttpMethod[];
  /** Whether the file contains Zod schema imports/definitions */
  hasZodSchemas: boolean;
  /** Whether the file contains withApi() wrapper (union-eyes pattern) */
  hasWithApi: boolean;
  /** Raw source for further analysis */
  source: string;
}

/** Per-app configuration for OpenAPI generation */
export interface AppConfig {
  /** App name */
  name: string;
  /** App directory */
  dir: string;
  /** Framework type */
  framework: 'nextjs' | 'fastify' | 'django';
  /** Base URL for the app */
  baseUrl: string;
  /** Port number */
  port?: number;
  /** Custom OpenAPI info */
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
}

/** Configuration for the generator */
export interface GeneratorConfig {
  /** Root directory of the monorepo */
  rootDir: string;
  /** Output directory for generated specs */
  outputDir: string;
  /** Apps to include (default: all) */
  apps?: string[];
  /** Whether to generate a combined spec */
  combined: boolean;
  /** Output format */
  format: 'json' | 'yaml';
}

/** OpenAPI 3.1 spec (simplified) */
export interface OpenApiSpec {
  openapi: '3.1.0';
  info: {
    title: string;
    description: string;
    version: string;
    contact?: { name: string; url?: string };
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
  security?: Array<Record<string, string[]>>;
}

/** Result of a generation run */
export interface GenerationResult {
  /** Per-app results */
  apps: Array<{
    name: string;
    routeCount: number;
    specPath?: string;
    errors: string[];
  }>;
  /** Combined spec path (if generated) */
  combinedSpecPath?: string;
  /** Total routes discovered */
  totalRoutes: number;
  /** Routes with Zod schemas */
  routesWithSchemas: number;
}
