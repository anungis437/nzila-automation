/**
 * Ambient module declarations for optional runtime dependencies.
 *
 * IMPORTANT: This file must NOT contain any top-level import/export statements.
 * Top-level imports turn a .d.ts into a module file, converting `declare module`
 * into module augmentations (which fail when the module doesn't exist).
 */

// --- Optional: playwright + axe-core (accessibility-service.ts) ---
declare module 'playwright' {
  export const chromium: {
    launch(opts?: { headless?: boolean }): Promise<{
      newPage(): Promise<{
        goto(url: string, opts?: { waitUntil?: string }): Promise<void>;
      }>;
      close(): Promise<void>;
    }>;
  };
}

declare module '@axe-core/playwright' {
  export class AxeBuilder {
    constructor(opts: { page: unknown });
    withTags(tags: string[]): this;
    analyze(): Promise<{ violations: unknown[] }>;
  }
}

// --- Optional: @sendgrid/mail ---
declare module '@sendgrid/mail' {
  const sgMail: {
    setApiKey(key: string): void;
    send(msg: Record<string, unknown>): Promise<unknown>;
  };
  export default sgMail;
}
