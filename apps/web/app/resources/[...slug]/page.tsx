import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDocBySlug, getAllDocSlugs } from '@/lib/docs';
import ScrollReveal from '@/components/public/ScrollReveal';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = getAllDocSlugs('public');
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug.join('/'), 'public');
  if (!doc) return { title: 'Not Found' };
  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function ResourceDocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug.join('/'), 'public');

  if (!doc) notFound();

  return (
    <main className="min-h-screen">
      {/* ─── Hero Header ─── */}
      <section className="relative overflow-hidden bg-navy pt-32 pb-16">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <Link
              href="/resources"
              className="inline-flex items-center text-sm text-electric-light hover:text-white transition-colors mb-8 group"
            >
              <svg
                className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Resources
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {doc.title}
            </h1>
          </ScrollReveal>

          {doc.description && (
            <ScrollReveal delay={0.15}>
              <p className="text-lg text-gray-300 max-w-2xl">{doc.description}</p>
            </ScrollReveal>
          )}

          <ScrollReveal delay={0.2}>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {doc.category && (
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-electric/20 text-electric-light">
                  {doc.category}
                </span>
              )}
              {doc.date && (
                <span className="text-sm text-gray-400">{doc.date}</span>
              )}
              {doc.readingTime && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {doc.readingTime} min read
                </span>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <article
              className="doc-prose prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: doc.htmlContent }}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Footer Nav ─── */}
      <section className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/resources"
              className="inline-flex items-center text-electric font-semibold hover:text-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              All Resources
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-electric text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-electric/25 btn-press"
            >
              Request More Information
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
