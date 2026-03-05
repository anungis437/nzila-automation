/**
 * @nzila/openapi-gen — barrel exports
 */

export { scanAllApps, scanNextjsApp, scanFastifyApp } from './scanner.js';
export { generate } from './generator.js';
export type {
  DiscoveredRoute,
  AppConfig,
  GeneratorConfig,
  GenerationResult,
  OpenApiSpec,
  HttpMethod,
} from './types.js';
