import Link from 'next/link'
import { getAllDocs } from '@/lib/docs'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export const metadata = {
  title: 'Resources | Nzila Ventures',
  description: 'Public documentation and resources from Nzila Ventures',
}

export default function ResourcesPage() {
  const docs = getAllDocs('public')

  // Group by category
  const grouped = docs.reduce<Record<string, typeof docs>>((acc, doc) => {
    const cat = doc.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {})

  const categories = Object.keys(grouped).sort()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Resources
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our public documentation, guides, and technical resources.
          </p>
        </div>
      </section>

      {/* Docs list */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {docs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No resources published yet.</p>
            <p className="text-sm mt-2">
              Add markdown files to <code className="bg-gray-100 px-1 rounded">content/public/</code> to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
                  {category}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[category]
                    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                    .map((doc) => (
                      <Link
                        key={doc.slug}
                        href={`/resources/${doc.slug}`}
                        className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{doc.description}</p>
                        )}
                        {doc.date && (
                          <p className="text-xs text-gray-400 mt-2">{doc.date}</p>
                        )}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
