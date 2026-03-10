import {
  OntologyEntityTypes,
  RelationshipTypes,
} from '@nzila/platform-ontology'

const entityTypeCount = Object.keys(OntologyEntityTypes).length
const relationshipTypeCount = Object.keys(RelationshipTypes).length

const SECTIONS = [
  {
    title: 'Ontology',
    href: '/ontology',
    stat: `${entityTypeCount} entity types · ${relationshipTypeCount} relationship types`,
    description: 'Canonical business ontology with entity types, relationships, and validators.',
  },
  {
    title: 'Entity Graph',
    href: '/entity-graph',
    stat: 'Graph Explorer',
    description: 'Semantic entity relationship graph with BFS traversal and subgraph extraction.',
  },
  {
    title: 'Event Fabric',
    href: '/events',
    stat: 'Event Stream',
    description: 'Platform-wide event backbone with pub/sub, persistence, and replay.',
  },
  {
    title: 'Knowledge Registry',
    href: '/knowledge',
    stat: 'Knowledge Assets',
    description: 'Policies, rules, playbooks, and templates — versioned and searchable.',
  },
  {
    title: 'Decision Graph',
    href: '/decisions',
    stat: 'Decision Trails',
    description: 'Explainable decision audit trails with BFS traversal.',
  },
  {
    title: 'Governed AI',
    href: '/ai-runs',
    stat: 'AI Run Audit',
    description: 'Policy-checked, evidence-grounded, fully audited AI operations.',
  },
  {
    title: 'Reasoning Engine',
    href: '/reasoning',
    stat: 'Reasoning Chains',
    description: 'Cross-vertical reasoning with citations and explainability.',
  },
  {
    title: 'Semantic Search',
    href: '/search',
    stat: 'Hybrid Search',
    description: 'Lexical, semantic, and hybrid search across platform entities.',
  },
  {
    title: 'Data Fabric',
    href: '/data-fabric',
    stat: 'Ingestion & Sync',
    description: 'Canonical data plane for external system ingestion and reconciliation.',
  },
] as const

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Platform Admin Dashboard</h1>
      <p className="mb-8 text-gray-500">
        Explore and manage the NzilaOS platform ontology, entity graph, and AI
        operations.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-1 text-xs font-medium text-blue-600">
              {section.stat}
            </p>
            <p className="mt-2 text-sm text-gray-500">{section.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
