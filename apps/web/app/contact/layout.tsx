import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Nzila Ventures — partnerships, investment inquiries, or platform demos. Reach our team today.',
  openGraph: {
    title: 'Contact Nzila Ventures',
    description: 'Partnerships, investment inquiries, and platform demos.',
    images: [{ url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=630&fit=crop&q=80', width: 1200, height: 630, alt: 'Modern open-plan office with large windows and natural light' }],
  },
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
