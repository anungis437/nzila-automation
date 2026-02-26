import en from './messages/en-CA.json';

type Messages = typeof en;

declare module '@sendgrid/mail' {
  const sgMail: {
    setApiKey(key: string): void;
    send(msg: Record<string, unknown>): Promise<unknown>;
  };
  export default sgMail;
}

// Optional runtime deps — only used in accessibility service when installed
declare module 'playwright' {
  export const chromium: {
    launch(opts?: { headless?: boolean }): Promise<{
      newPage(): Promise<{ goto(url: string, opts?: { waitUntil?: string }): Promise<void> }>;
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

declare global {
  // Use type safe message keys with `next-intl`
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
