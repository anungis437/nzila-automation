# @nzila/platform-entity-graph

Semantic entity relationship graph for NzilaOS.

## Purpose

Provides a canonical graph layer for traversing linked entities across domains. Not just database joins — a semantic relationship graph.

## Core Operations

```ts
import {
  getEntityNode,
  getEntityNeighbors,
  buildEntitySubgraph,
  resolveRelationshipPath,
  createInMemoryGraphStore,
} from '@nzila/platform-entity-graph'

const store = createInMemoryGraphStore()

// Get a node
const client = await getEntityNode(store, tenantId, 'Client', clientId)

// Get all neighbors
const neighbors = await getEntityNeighbors(store, tenantId, 'Client', clientId)

// Build subgraph from seed
const subgraph = await buildEntitySubgraph(store, tenantId, 'Client', clientId, 3)

// Find path between entities
const path = await resolveRelationshipPath(store, tenantId, 'Client', clientId, 'Document', docId)
```

## Store Interface

Implement `EntityGraphStore` to back the graph with your database.
