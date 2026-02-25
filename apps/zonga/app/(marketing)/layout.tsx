/**
 * Marketing Layout — Shell for all public-facing Zonga pages.
 */
import SiteNavigation from '@/components/public/site-navigation';
import SiteFooter from '@/components/public/site-footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNavigation />
      <main className="pt-16 md:pt-20">{children}</main>
      <SiteFooter />
    </>
  );
}
