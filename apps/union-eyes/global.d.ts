import en from './messages/en-CA.json';

type Messages = typeof en;

declare module '@sendgrid/mail' {
  const sgMail: {
    setApiKey(key: string): void;
    send(msg: Record<string, unknown>): Promise<unknown>;
  };
  export default sgMail;
}

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
