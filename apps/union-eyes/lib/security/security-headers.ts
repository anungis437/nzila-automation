/**
 * Security Headers Middleware
 * 
 * Provides comprehensive security headers for protecting against common web vulnerabilities
 * Implements OWASP recommendations for security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Security header configuration
export interface SecurityHeadersConfig {
  contentSecurityPolicy: boolean;
  xssProtection: boolean;
  frameOptions: 'DENY' | 'SAMEORIGIN' | string;
  referrerPolicy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'strict-origin-when-cross-origin';
  permissionsPolicy: Record<string, string[]>;
  hsts: boolean;
  hstsMaxAge: number;
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: true,
  xssProtection: true,
  frameOptions: 'DENY',
  referrerPolicy: 'strict-origin-when-cross-origin',
  hsts: true,
  hstsMaxAge: 31536000, // 1 year
  permissionsPolicy: {
    'camera': ['self'],
    'microphone': ['self'],
    'geolocation': ['self'],
    'payment': ['self'],
  },
};

/**
 * Generate Content Security Policy
 */
function generateCSP(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

/**
 * Generate Permissions Policy
 */
function generatePermissionsPolicy(config: SecurityHeadersConfig): string {
  return Object.entries(config.permissionsPolicy)
    .map(([feature, allowedOrigins]) => {
      const origins = allowedOrigins.length > 0 ? allowedOrigins.join(' ') : "'none'";
      return `${feature}=(${origins})`;
    })
    .join(', ');
}

/**
 * Security headers middleware
 */
export function securityHeaders(
  request: NextRequest,
  response: NextResponse,
  config: Partial<SecurityHeadersConfig> = {}
): NextResponse {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const headers = response.headers;

  // Content Security Policy
  if (cfg.contentSecurityPolicy) {
    headers.set('Content-Security-Policy', generateCSP());
  }

  // X-Content-Type-Options
  headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  headers.set('X-Frame-Options', cfg.frameOptions);

  // X-XSS-Protection
  if (cfg.xssProtection) {
    headers.set('X-XSS-Protection', '1; mode=block');
  }

  // Referrer-Policy
  headers.set('Referrer-Policy', cfg.referrerPolicy);

  // Permissions-Policy
  headers.set('Permissions-Policy', generatePermissionsPolicy(cfg));

  // Strict-Transport-Security (HSTS)
  if (cfg.hsts) {
    const hstsValue = `max-age=${cfg.hstsMaxAge}; includeSubDomains`;
    headers.set('Strict-Transport-Security', hstsValue);
  }

  // Remove sensitive headers that might leak info
  headers.delete('X-Powered-By');
  headers.delete('X-AspNet-Version');
  headers.delete('X-AspNetMvc-Version');

  logger.debug('Security headers applied', {
    path: request.nextUrl.pathname,
  });

  return response;
}

/**
 * Create security headers middleware function
 */
export function createSecurityMiddleware(config?: Partial<SecurityHeadersConfig>) {
  return (request: NextRequest) => {
    const response = NextResponse.next();
    return securityHeaders(request, response, config);
  };
}

/**
 * Get current security configuration
 */
export function getSecurityConfig(): SecurityHeadersConfig {
  return DEFAULT_CONFIG;
}
