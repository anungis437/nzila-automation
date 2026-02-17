import Link from 'next/link';
import { ArrowRightIcon, RocketLaunchIcon, ShieldCheckIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function Portfolio() {
  const platforms = [
    { 
      name: 'Union Eyes', 
      vertical: 'Uniontech', 
      size: '332 MB', 
      entities: '4,773', 
      complexity: 'EXTREME',
      readiness: 9.5,
      status: 'Flagship - In Development',
      tam: '$50B',
      description: 'Union management, pension forecasting, grievance tracking'
    },
    { 
      name: 'ABR Insights', 
      vertical: 'EdTech/Legaltech', 
      size: '8.8 MB', 
      entities: '132', 
      complexity: 'EXTREME',
      readiness: 9.1,
      status: 'Production Ready',
      tam: '$1.5B',
      description: 'Anti-racism LMS, tribunal case database, AI coach'
    },
    { 
      name: 'C3UO / DiasporaCore', 
      vertical: 'Fintech', 
      size: '9.2 MB', 
      entities: '485', 
      complexity: 'EXTREME',
      readiness: 6.5,
      status: 'In Development',
      tam: '$100B',
      description: 'Diaspora banking, KYC/AML, international transfers'
    },
    { 
      name: 'CongoWave', 
      vertical: 'Entertainment', 
      size: '12.8 MB', 
      entities: '83+', 
      complexity: 'HIGH-EXTREME',
      readiness: 10.0,
      status: 'Production Ready',
      tam: '$50B',
      description: 'Music streaming, royalty management, event ticketing'
    },
    { 
      name: 'SentryIQ360', 
      vertical: 'Insurtech', 
      size: '79 MB', 
      entities: '79+', 
      complexity: 'HIGH-EXTREME',
      readiness: 7.0,
      status: 'In Development',
      tam: '$30B',
      description: 'Insurance arbitrage, underwriting AI, policy lifecycle'
    },
    { 
      name: 'Court Lens', 
      vertical: 'Legaltech', 
      size: '198 MB', 
      entities: '682', 
      complexity: 'HIGH',
      readiness: 6.0,
      status: 'In Development',
      tam: '$12B',
      description: 'Legal AI, case management, eDiscovery'
    },
    { 
      name: 'CORA', 
      vertical: 'Agrotech', 
      size: '0.5 MB', 
      entities: '80+', 
      complexity: 'HIGH',
      readiness: 7.0,
      status: 'Beta',
      tam: '$8.6B',
      description: 'Farm management, supply chain, market intelligence'
    },
    { 
      name: 'CyberLearn', 
      vertical: 'EdTech', 
      size: '5 MB', 
      entities: '30+', 
      complexity: 'HIGH',
      readiness: 7.5,
      status: 'In Development',
      tam: '$8B',
      description: 'Cybersecurity training, Docker labs, CTF challenges'
    },
    { 
      name: 'Shop Quoter', 
      vertical: 'Commerce', 
      size: '102 MB', 
      entities: '93', 
      complexity: 'HIGH-EXTREME',
      readiness: 7.0,
      status: 'In Development',
      tam: '$5B',
      description: 'Corporate gift boxes, CRM integration, WhatsApp AI'
    },
    { 
      name: 'Trade OS', 
      vertical: 'Trade', 
      size: '10 MB', 
      entities: '337', 
      complexity: 'MEDIUM-HIGH',
      readiness: 6.5,
      status: 'In Development',
      tam: '$15B',
      description: 'Trade operations, multi-carrier logistics, customs'
    },
    { 
      name: 'eExports', 
      vertical: 'Trade', 
      size: '6.6 MB', 
      entities: '78', 
      complexity: 'MEDIUM-HIGH',
      readiness: 8.0,
      status: 'Django PoC',
      tam: '$3B',
      description: 'Export documentation, compliance, shipment tracking'
    },
    { 
      name: 'PonduOps', 
      vertical: 'Agrotech', 
      size: '1.7 MB', 
      entities: '220', 
      complexity: 'HIGH',
      readiness: 5.0,
      status: 'Base44',
      tam: '$8B',
      description: 'Supply chain ERP, crop planning, IoT integration'
    },
    { 
      name: 'Insight CFO', 
      vertical: 'Fintech', 
      size: '0.6 MB', 
      entities: '37', 
      complexity: 'HIGH',
      readiness: 6.0,
      status: 'Base44',
      tam: '$2B',
      description: 'Virtual CFO, accounting, QuickBooks/Xero integration'
    },
    { 
      name: 'STSA / Lexora', 
      vertical: 'Fintech', 
      size: '0.9 MB', 
      entities: '95', 
      complexity: 'HIGH',
      readiness: 6.0,
      status: 'Base44',
      tam: '$5B',
      description: 'Banking stress testing, Basel III/IV compliance'
    },
    { 
      name: 'Memora', 
      vertical: 'Healthtech', 
      size: '2.3 MB', 
      entities: '150', 
      complexity: 'MEDIUM',
      readiness: 5.0,
      status: 'Legacy',
      tam: '$20B',
      description: 'Cognitive wellness, dementia care, caregiver support'
    },
  ];

  const getComplexityColor = (complexity: string) => {
    if (complexity === 'EXTREME') return 'bg-red-100 text-red-700';
    if (complexity === 'HIGH-EXTREME') return 'bg-orange-100 text-orange-700';
    if (complexity === 'HIGH') return 'bg-yellow-100 text-yellow-700';
    if (complexity === 'MEDIUM-HIGH') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Production Ready')) return 'bg-green-100 text-green-700';
    if (status.includes('Flagship')) return 'bg-blue-100 text-blue-700';
    if (status.includes('Beta')) return 'bg-purple-100 text-purple-700';
    if (status.includes('Django')) return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Platform Portfolio
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            15 platforms across 10+ verticals, unified into a single intelligent backbone infrastructure
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="font-bold text-blue-600">$4M+</span>
              <span className="text-gray-600 ml-2">Engineering Investment</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="font-bold text-blue-600">56%</span>
              <span className="text-gray-600 ml-2">Time Savings</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="font-bold text-blue-600">$100B+</span>
              <span className="text-gray-600 ml-2">TAM</span>
            </div>
          </div>
        </div>

        {/* Complexity Legend */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="text-sm text-gray-600">EXTREME</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span className="text-sm text-gray-600">HIGH-EXTREME</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="text-sm text-gray-600">HIGH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">MEDIUM-HIGH</span>
          </div>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <div key={platform.name} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900">{platform.name}</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getComplexityColor(platform.complexity)}`}>
                  {platform.complexity}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {platform.vertical}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(platform.status)}`}>
                  {platform.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-blue-600">{platform.entities}</div>
                  <div className="text-xs text-gray-500">Entities</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{platform.readiness}/10</div>
                  <div className="text-xs text-gray-500">Readiness</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs font-bold text-purple-600">{platform.tam}</div>
                  <div className="text-xs text-gray-500">TAM</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                <span>{platform.size}</span>
                <div className="flex items-center gap-1">
                  <CpuChipIcon className="h-4 w-4" />
                  <span>{platform.complexity === 'EXTREME' ? '🔴' : platform.complexity.includes('HIGH') ? '🟠' : '🟢'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Migration Roadmap */}
        <div className="mt-16 bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Migration Roadmap</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm font-semibold text-blue-600 mb-1">Phase 1</div>
              <div className="text-lg font-bold text-gray-900">Foundation</div>
              <div className="text-sm text-gray-600">16 weeks</div>
              <div className="text-xs text-gray-500 mt-2">Backbone core</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="text-sm font-semibold text-indigo-600 mb-1">Phase 2-3</div>
              <div className="text-lg font-bold text-gray-900">Django PoC</div>
              <div className="text-sm text-gray-600">20 weeks</div>
              <div className="text-xs text-gray-500 mt-2">eExports, Union Eyes</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-sm font-semibold text-purple-600 mb-1">Phase 4-7</div>
              <div className="text-lg font-bold text-gray-900">Scale</div>
              <div className="text-sm text-gray-600">100 weeks</div>
              <div className="text-xs text-gray-500 mt-2">Fintech, EdTech, Commerce</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-sm font-semibold text-green-600 mb-1">Phase 8</div>
              <div className="text-lg font-bold text-gray-900">Complete</div>
              <div className="text-sm text-gray-600">16 weeks</div>
              <div className="text-xs text-gray-500 mt-2">Agrotech, Consolidate</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
              <span><strong>Total Timeline:</strong> 175 weeks (~40 months) sequential</span>
            </div>
            <div><strong>Parallel (3 teams):</strong> ~15 months</div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link 
            href="/verticals" 
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explore Verticals
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
