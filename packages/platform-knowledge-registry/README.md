# @nzila/platform-knowledge-registry

Centralized knowledge asset registry for NzilaOS.

## Purpose

Manages structured and semi-structured knowledge assets: policies, rules, program requirements, playbooks, templates, prompt templates, and decision rules across all verticals.

## Usage

```ts
import {
  KnowledgeTypes,
  createInMemoryKnowledgeStore,
  registerKnowledgeAsset,
  searchKnowledgeAssets,
  resolveApplicableKnowledge,
} from '@nzila/platform-knowledge-registry'

const store = createInMemoryKnowledgeStore()

// Register a knowledge asset
const asset = await registerKnowledgeAsset(store, {
  tenantScope: 'tenant-uuid',
  domainScope: 'mobility',
  title: 'H-1B Eligibility Rules',
  knowledgeType: KnowledgeTypes.RULE,
  source: 'legal-team',
  effectiveDate: new Date().toISOString(),
  tags: ['h1b', 'eligibility'],
  textPayload: 'Applicant must hold a bachelor\'s degree...',
})

// Search
const results = await searchKnowledgeAssets(store, { domainScope: 'mobility' })

// Resolve applicable knowledge for AI grounding
const applicable = await resolveApplicableKnowledge(store, 'tenant-uuid', 'mobility')
```
