import en from './messages/en-CA.json';

type Messages = typeof en;

// NOTE: Ambient module declarations (playwright, @sendgrid/mail, @axe-core/playwright)
// are in modules.d.ts — a separate file without imports, so they work as true ambient
// declarations rather than module augmentations.

declare global {
  // Use type safe message keys with `next-intl`
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
