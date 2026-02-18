import Link from 'next/link'
import {
  HeartIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  BuildingOfficeIcon,
  MusicalNoteIcon,
  BeakerIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

export default function Verticals() {
  const verticals = [
    {
      name: 'Fintech',
      icon: CurrencyDollarIcon,
      platforms: ['DiasporaCore V2', 'STSA/Lexora', 'Insight CFO'],
      description:
        'Banking, payments, stress testing, and virtual CFO services for individuals and enterprises.',
      tam: '$100B+',
      entities: '617',
      status: '3 platforms',
      color: 'from-green-600 to-emerald-600',
    },
    {
      name: 'Agrotech',
      icon: BeakerIcon,
      platforms: ['CORA', 'PonduOps'],
      description:
        'Farm management, supply chain, IoT integration, and agricultural market intelligence.',
      tam: '$8.6B',
      entities: '300',
      status: '2 platforms',
      color: 'from-lime-600 to-green-600',
    },
    {
      name: 'Uniontech',
      icon: UserGroupIcon,
      platforms: ['Union Eyes'],
      description:
        'Union management, pension forecasting, grievance tracking, and labor organizing.',
      tam: '$50B',
      entities: '4,773',
      status: 'Flagship platform',
      color: 'from-orange-500 to-red-500',
    },
    {
      name: 'Legaltech',
      icon: ScaleIcon,
      platforms: ['Court Lens', 'ABR Insights'],
      description: 'Case management, legal AI, tribunal databases, and eDiscovery services.',
      tam: '$13B+',
      entities: '814',
      status: '2 platforms',
      color: 'from-indigo-600 to-blue-600',
    },
    {
      name: 'EdTech',
      icon: BuildingOfficeIcon,
      platforms: ['ABR Insights', 'CyberLearn'],
      description:
        'Learning management, certification, cybersecurity training, and gamified education.',
      tam: '$13B+',
      entities: '162',
      status: '2 platforms',
      color: 'from-purple-600 to-pink-600',
    },
    {
      name: 'Commerce',
      icon: ShoppingCartIcon,
      platforms: ['Shop Quoter', 'Trade OS', 'eExports'],
      description: 'E-commerce, logistics, trade operations, and export documentation.',
      tam: '$25B',
      entities: '508',
      status: '3 platforms',
      color: 'from-amber-500 to-orange-500',
    },
    {
      name: 'Entertainment',
      icon: MusicalNoteIcon,
      platforms: ['CongoWave'],
      description:
        'Music streaming, royalty management, event ticketing, and content distribution.',
      tam: '$50B',
      entities: '83',
      status: 'Production ready',
      color: 'from-pink-500 to-rose-500',
    },
    {
      name: 'Healthtech',
      icon: HeartIcon,
      platforms: ['Memora'],
      description: 'Cognitive wellness, dementia care, caregiver support, and health monitoring.',
      tam: '$20B',
      entities: '150',
      status: 'Legacy',
      color: 'from-red-500 to-pink-500',
    },
    {
      name: 'Insurtech',
      icon: ShieldCheckIcon,
      platforms: ['SentryIQ360'],
      description:
        'Insurance arbitrage, underwriting AI, policy lifecycle, and claims intelligence.',
      tam: '$30B',
      entities: '79',
      status: 'In development',
      color: 'from-cyan-600 to-blue-600',
    },
    {
      name: 'Justice',
      icon: GlobeAltIcon,
      platforms: ['ABR Insights'],
      description: 'Anti-racism training, DEI analytics, and equity impact measurement.',
      tam: '$1.5B',
      entities: '132',
      status: 'Production ready',
      color: 'from-teal-600 to-cyan-600',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-blue-600 to-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              10+ Strategic Verticals
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Diverse sectors united by a common mission: building ethical technology that serves
              real human needs across healthcare, finance, justice, and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <span className="text-2xl font-bold text-white">15</span>
              <span className="text-gray-400 ml-2">Platforms</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">10+</span>
              <span className="text-gray-400 ml-2">Verticals</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">$100B+</span>
              <span className="text-gray-400 ml-2">TAM</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">12,000+</span>
              <span className="text-gray-400 ml-2">Entities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Verticals Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {verticals.map((vertical) => (
              <div
                key={vertical.name}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200"
              >
                {/* Header with gradient */}
                <div className={`bg-linear-to-r ${vertical.color} p-6`}>
                  <div className="flex items-center gap-4">
                    <vertical.icon className="h-10 w-10 text-white" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{vertical.name}</h2>
                      <p className="text-sm text-white/90">{vertical.status}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{vertical.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">
                        {vertical.platforms.length}
                      </div>
                      <div className="text-xs text-gray-500">Platforms</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600">
                        {vertical.entities.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Entities</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-sm font-bold text-purple-600">{vertical.tam}</div>
                      <div className="text-xs text-gray-500">TAM</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Platforms:</h3>
                    <ul className="space-y-1">
                      {vertical.platforms.map((platform) => (
                        <li key={platform} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{platform}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Backbone Value Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cross-Vertical Impact</h2>
            <p className="text-lg text-gray-600">
              Our unified Backbone infrastructure enables synergies across all verticals
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-blue-600 mb-2">80%+</div>
              <div className="text-gray-600 font-medium">Code Reuse</div>
              <p className="text-sm text-gray-500 mt-2">Shared services across verticals</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-blue-600 mb-2">56%</div>
              <div className="text-gray-600 font-medium">Time Savings</div>
              <p className="text-sm text-gray-500 mt-2">Through Backbone migration</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-blue-600 mb-2">$5.7M</div>
              <div className="text-gray-600 font-medium">IP Value</div>
              <p className="text-sm text-gray-500 mt-2">Trade secrets & patents</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-blue-600 mb-2">200+</div>
              <div className="text-gray-600 font-medium">AI Prompts</div>
              <p className="text-sm text-gray-500 mt-2">Companion Engine</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Interested in a Specific Vertical?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Learn more about how our platforms serve your sector&apos;s unique needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            Contact Our Team
          </Link>
        </div>
      </section>
    </main>
  )
}
