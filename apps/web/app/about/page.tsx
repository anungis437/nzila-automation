import { CheckCircleIcon, LightBulbIcon, HeartIcon, ScaleIcon } from '@heroicons/react/24/outline'

export default function About() {
  const values = [
    {
      icon: HeartIcon,
      title: 'Human-Centered',
      description:
        'Every solution we build prioritizes the people it serves, ensuring accessibility, dignity, and real-world impact.',
    },
    {
      icon: ScaleIcon,
      title: 'Ethical Integrity',
      description:
        'We maintain unwavering ethical standards in IP management, data handling, and platform governance.',
    },
    {
      icon: LightBulbIcon,
      title: 'Innovation-Driven',
      description:
        'Continuous innovation through our unified Backbone infrastructure powers transformation across all verticals.',
    },
    {
      icon: CheckCircleIcon,
      title: 'Impact-Focused',
      description:
        'Measurable outcomes drive our work—68.6% time savings and 47.7% cost savings across our portfolio.',
    },
  ]

  const timeline = [
    {
      year: '2020-2023',
      title: 'Platform Development',
      description:
        'Built 15 specialized platforms across 10 verticals, serving healthcare, legal, insurance, agriculture, and more.',
    },
    {
      year: '2024',
      title: 'Portfolio Consolidation',
      description:
        'Analyzed $2M+ in legacy investments and designed unified Backbone architecture for sustainable growth.',
    },
    {
      year: '2025-2026',
      title: 'Backbone Migration',
      description:
        'Currently executing ~100-week migration roadmap to transform all platforms onto shared infrastructure.',
    },
    {
      year: '2026+',
      title: 'Scale & Innovation',
      description:
        'Expanding platform capabilities, deepening vertical integration, and amplifying community impact.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-blue-600 to-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">About Nzila Ventures</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              A venture studio and ethical IP-holding company transforming legacy platforms into
              modern, scalable solutions that serve communities worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              To advance human-centered solutions in care, cognition, learning, and equity by
              building and maintaining ethical technology platforms that serve real-world needs. We
              transform fragmented legacy systems into unified, scalable infrastructure that
              amplifies impact while respecting user dignity and data sovereignty.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              A world where technology seamlessly supports human flourishing across healthcare,
              justice, commerce, and culture. Through our Backbone infrastructure, we envision
              interconnected platforms that reduce operational burden, increase accessibility, and
              create measurable improvements in people&apos;s lives.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide every decision, every line of code, and every partnership.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <value.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-lg text-gray-600">
              From diverse platforms to unified infrastructure
            </p>
          </div>

          <div className="space-y-8">
            {timeline.map((milestone, index) => (
              <div key={milestone.year} className="flex gap-6">
                <div className="shrink-0 w-32 text-right">
                  <span className="text-lg font-bold text-blue-600">{milestone.year}</span>
                </div>
                <div className="relative flex-1 pb-8">
                  {index !== timeline.length - 1 && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-200" />
                  )}
                  <div className="absolute left-0 top-0 w-4 h-4 -ml-[7px] rounded-full bg-blue-600" />
                  <div className="ml-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-linear-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">15</div>
              <div className="text-blue-100">Legacy Platforms</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10</div>
              <div className="text-blue-100">Strategic Verticals</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">$2M+</div>
              <div className="text-blue-100">Total Investment</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">~100</div>
              <div className="text-blue-100">Week Migration</div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Built with Intentionality, Ethics, and Impact
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Every platform we build, every line of code we write, and every partnership we form is
            guided by our commitment to ethical technology that truly serves humanity.
          </p>
        </div>
      </section>
    </main>
  )
}
