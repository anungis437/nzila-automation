import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocBySlug, getAllDocSlugs } from '@/lib/docs'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams() {
  const slugs = getAllDocSlugs('public')
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const doc = await getDocBySlug(slug.join('/'), 'public')
  if (!doc) return { title: 'Not Found' }
  return {
    title: `${doc.title} | Nzila Resources`,
    description: doc.description,
  }
}

export default async function ResourceDocPage({ params }: PageProps) {
  const { slug } = await params
  const doc = await getDocBySlug(slug.join('/'), 'public')

  if (!doc) notFound()

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/resources"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Resources
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="text-lg text-gray-500">{doc.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
            {doc.category && (
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{doc.category}</span>
            )}
            {doc.date && <span>{doc.date}</span>}
          </div>
        </header>

        {/* Content */}
        <article
          className="prose prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-600"
          dangerouslySetInnerHTML={{ __html: doc.htmlContent }}
        />
      </div>
    </main>
  )
}
