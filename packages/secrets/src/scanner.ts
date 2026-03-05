/**
 * Secret Scanner
 *
 * Programmatic secret detection for CI pipelines.
 * Complements TruffleHog + Gitleaks with Nzila-specific patterns.
 */

import { z } from 'zod';

export const SecretPatternSchema = z.object({
  name: z.string(),
  pattern: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string(),
});

export type SecretPattern = z.infer<typeof SecretPatternSchema>;

export const ScanResultSchema = z.object({
  file: z.string(),
  line: z.number(),
  pattern: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  match: z.string(),
  redacted: z.string(),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;

// ── Nzila-specific patterns ──────────────────────────────────────────────────

const NZILA_SECRET_PATTERNS: SecretPattern[] = [
  {
    name: 'clerk-secret-key',
    pattern: 'sk_live_[A-Za-z0-9]{20,}',
    severity: 'critical',
    description: 'Clerk production secret key',
  },
  {
    name: 'clerk-test-key',
    pattern: 'sk_test_(?!placeholder)[A-Za-z0-9]{20,}',
    severity: 'high',
    description: 'Clerk test secret key (non-placeholder)',
  },
  {
    name: 'stripe-secret-key',
    pattern: 'sk_live_[A-Za-z0-9]{20,}',
    severity: 'critical',
    description: 'Stripe production secret key',
  },
  {
    name: 'stripe-webhook-secret',
    pattern: 'whsec_[A-Za-z0-9]{20,}',
    severity: 'high',
    description: 'Stripe webhook signing secret',
  },
  {
    name: 'azure-keyvault-url',
    pattern: 'https://[a-z0-9-]+\\.vault\\.azure\\.net',
    severity: 'medium',
    description: 'Azure Key Vault URL (check if secret is exposed nearby)',
  },
  {
    name: 'database-connection-string',
    pattern: 'postgresql://[^\\s]+:[^@\\s]+@(?!localhost)',
    severity: 'critical',
    description: 'PostgreSQL connection string with credentials (non-localhost)',
  },
  {
    name: 'qbo-client-secret',
    pattern: 'QBO_CLIENT_SECRET=(?!placeholder)[A-Za-z0-9]{10,}',
    severity: 'high',
    description: 'QuickBooks Online client secret',
  },
  {
    name: 'openai-api-key',
    pattern: 'sk-[A-Za-z0-9]{20,}',
    severity: 'critical',
    description: 'OpenAI API key',
  },
  {
    name: 'azure-storage-key',
    pattern: 'AccountKey=[A-Za-z0-9+/=]{30,}',
    severity: 'critical',
    description: 'Azure Storage account key',
  },
];

// ── Scanner ──────────────────────────────────────────────────────────────────

export class SecretScanner {
  private patterns: SecretPattern[];

  constructor(additionalPatterns: SecretPattern[] = []) {
    this.patterns = [...NZILA_SECRET_PATTERNS, ...additionalPatterns];
  }

  /**
   * Scan a single file content for secrets.
   */
  scanContent(filePath: string, content: string): ScanResult[] {
    const results: ScanResult[] = [];
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      const regex = new RegExp(pattern.pattern, 'g');

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum]!;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(line)) !== null) {
          // Skip allowlisted files
          if (this.isAllowlisted(filePath, match[0])) continue;

          results.push({
            file: filePath,
            line: lineNum + 1,
            pattern: pattern.name,
            severity: pattern.severity,
            match: match[0],
            redacted: this.redact(match[0]),
          });
        }
      }
    }

    return results;
  }

  private isAllowlisted(filePath: string, _match: string): boolean {
    const allowlistedPaths = [
      '.env.example',
      '.env.test',
      'pnpm-lock.yaml',
      '*.snap',
      '.gitleaks.toml',
    ];

    return allowlistedPaths.some((pattern) => {
      if (pattern.startsWith('*')) {
        return filePath.endsWith(pattern.slice(1));
      }
      return filePath.endsWith(pattern);
    });
  }

  private redact(value: string): string {
    if (value.length <= 8) return '***REDACTED***';
    return value.slice(0, 4) + '***REDACTED***' + value.slice(-4);
  }
}
