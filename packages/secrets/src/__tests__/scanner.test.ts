import { describe, it, expect } from 'vitest';
import { SecretScanner } from '../scanner.js';

// Build test secrets dynamically to avoid triggering GitHub secret scanning
const clerkPrefix = ['sk', 'live'].join('_');
const clerkKey = `${clerkPrefix}_${'A'.repeat(24)}`;
const openaiPrefix = ['sk', 'aBcDeFgHiJkLmNoPqRsTuVwXyZ123456'].join('-');

describe('SecretScanner', () => {
  it('detects a Clerk production secret key', () => {
    const scanner = new SecretScanner();
    const results = scanner.scanContent(
      'test-file.ts',
      `const key = "${clerkKey}";`,
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.severity).toBe('critical');
  });

  it('returns empty for clean content', () => {
    const scanner = new SecretScanner();
    const results = scanner.scanContent(
      'test-file.ts',
      'const greeting = "Hello, World!";',
    );
    expect(results).toEqual([]);
  });

  it('detects an OpenAI API key', () => {
    const scanner = new SecretScanner();
    const results = scanner.scanContent(
      'config.ts',
      `OPENAI_KEY=${openaiPrefix}`,
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.pattern === 'openai-api-key')).toBe(true);
  });

  it('supports custom additional patterns', () => {
    const scanner = new SecretScanner([
      {
        name: 'custom-token',
        pattern: 'CUSTOM_[A-Z0-9]{10,}',
        severity: 'high',
        description: 'Custom token',
      },
    ]);
    const results = scanner.scanContent(
      'env.ts',
      'token = "CUSTOM_ABCDEFGHIJ"',
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.pattern).toBe('custom-token');
  });
});
