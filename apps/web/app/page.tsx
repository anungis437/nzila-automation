import Link from 'next/link';
import { RocketLaunchIcon, ChartBarIcon, GlobeAltIcon, UserGroupIcon, ShieldCheckIcon, LightBulbIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const stats = [
    { label: 'Platforms', value: '15' },
    { label: 'Verticals', value: '10+' },
    { label: 'TAM', value: '$100B+' },
    { label: 'ARR Target', value: '$6M' },
  ];

  const verticals = [
    { name: 'Fintech', icon: '💰', description: 'Banking, payments, insurance' },
    { name: 'Agrotech', icon: '🌾', description: 'Farm management, supply chain' },
    { name: 'Uniontech', icon: '✊', description: 'Labor rights, union management' },
    { name: 'Legaltech', icon: '⚖️', description: 'Case management, legal AI' },
    { name: 'EdTech', icon: '📚', description: 'Learning, training, certification' },
    { name: 'Entertainment', icon: '🎵', description: 'Streaming, content platforms' },
    { name: 'Commerce', icon: '🛒', description: 'Trade, logistics, gifting' },
    { name: 'Healthtech', icon: '🏥', description: 'Care, wellness, cognitive' },
    { name: 'Insurtech', icon: '🛡️', description: 'Arbitrage, underwriting AI' },
    { name: 'Justice', icon: '⚖️', description: 'Advocacy, DEI training' },
  ];

  const platforms = [
    { name: 'Union Eyes', vertical: 'Uniontech', status: 'Flagship', entities: '4,773' },
    { name: 'ABR Insights', vertical: 'EdTech', status: 'Production Ready', entities: '132' },
    { name: 'CORA', vertical: 'Agrotech', status: 'Beta', entities: '80' },
    { name: 'CongoWave', vertical: 'Entertainment', status: 'Production Ready', entities: '83' },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nzila Ventures
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Multi-Vertical Platform Company
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Building the infrastructure for <strong>social impact technology</strong> across healthcare, finance, agriculture, labor rights, and justice
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Our Portfolio
                <RocketLaunchIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Infrastructure for Social Impact
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8">
            We transform legacy platforms into modern, scalable solutions that serve communities 
            across healthcare, legal systems, insurance, agriculture, and beyond. Our unified 
            Backbone infrastructure powers innovation while maintaining ethical integrity.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center text-white">
              <ChartBarIcon className="h-6 w-6 mr-2" />
              <span>Data-Driven</span>
            </div>
            <div className="flex items-center text-white">
              <GlobeAltIcon className="h-6 w-6 mr-2" />
              <span>Global Impact</span>
            </div>
            <div className="flex items-center text-white">
              <UserGroupIcon className="h-6 w-6 mr-2" />
              <span>Human-Centered</span>
            </div>
            <div className="flex items-center text-white">
              <ShieldCheckIcon className="h-6 w-6 mr-2" />
              <span>Ethical AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Platforms */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Flagship Platforms
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our production-ready platforms solving critical problems across verticals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">{platform.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    platform.status === 'Production Ready' 
                      ? 'bg-green-100 text-green-700' 
                      : platform.status === 'Flagship'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {platform.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{platform.vertical}</p>
                <div className="text-2xl font-bold text-blue-600">
                  {platform.entities} <span className="text-sm font-normal text-gray-500">entities</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/portfolio"
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
            >
              View Full Portfolio
              <RocketLaunchIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Verticals Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              10+ Strategic Verticals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our portfolio spans diverse sectors, each addressing critical needs with 
              technology-driven, ethical solutions.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {verticals.map((vertical) => (
              <Link
                key={vertical.name}
                href="/verticals"
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="text-3xl mb-3">{vertical.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{vertical.name}</h3>
                <p className="text-xs text-gray-500">{vertical.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* IP & Value */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <LightBulbIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <div className="text-4xl font-bold text-white mb-2">$5.7M-$7.5M</div>
              <div className="text-gray-400">IP Portfolio Value</div>
            </div>
            <div className="text-center">
              <ShieldCheckIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <div className="text-4xl font-bold text-white mb-2">200+</div>
              <div className="text-gray-400">AI Prompts (Trade Secret)</div>
            </div>
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <div className="text-4xl font-bold text-white mb-2">12,000+</div>
              <div className="text-gray-400">Database Entities</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <RocketLaunchIcon className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Vision?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join us in building ethical, impactful technology that serves communities worldwide.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            Get In Touch
          </Link>
        </div>
      </section>
    </main>
  );
}
