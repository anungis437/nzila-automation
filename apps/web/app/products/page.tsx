import Link from 'next/link'
import { RocketLaunchIcon } from '@heroicons/react/24/outline'

export const metadata = {
  title: 'Products | Nzila Ventures',
  description: 'Our portfolio of 15 platforms across 10 verticals',
}

const flagship = [
  {
    name: 'Union Eyes',
    vertical: 'Uniontech',
    status: 'Flagship',
    description: 'Comprehensive labor union management and advocacy platform.',
  },
  {
    name: 'ABR Insights',
    vertical: 'EdTech',
    status: 'Production Ready',
    description: 'Anti-bias research and educational insights platform.',
  },
  {
    name: 'CORA',
    vertical: 'Agrotech',
    status: 'Beta',
    description: 'Agricultural management and supply-chain intelligence.',
  },
  {
    name: 'CongoWave',
    vertical: 'Entertainment',
    status: 'Production Ready',
    description: 'Congolese music and cultural content streaming platform.',
  },
]

export default function ProductsPage() {
  return (
    <main className="min-h-screen">
      <section className="bg-linear-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Products</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            15 platforms across 10 verticals — each built on the Nzila Backbone.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Flagship Products</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {flagship.map((p) => (
            <div
              key={p.name}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{p.description}</p>
              <span className="text-xs text-gray-400">{p.vertical}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Want to Learn More?</h2>
          <p className="text-blue-100 mb-8">
            Explore our resources or reach out to discuss partnerships.
          </p>
          <Link
            href="/resources"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Browse Resources
            <RocketLaunchIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  )
}
