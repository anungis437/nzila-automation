# Runbook: Platform Entity & Knowledge Graph Failure

**Scope:** Failures in `platform-entity-graph`, `platform-knowledge-registry`, `platform-context-orchestrator`  
**Severity:** P3 (query degradation) / P2 (entity resolution failure) / P1 (cross-vertical context loss)  
**On-call:** Platform Engineering

## Detection

Entity/knowledge graph failures surface through:

1. **Entity resolution failures** — cross-vertical lookups return empty or stale results
2. **Knowledge retrieval errors** — `platform-knowledge-registry` queries time out or return errors
3. **Context orchestration failures** — `platform-context-orchestrator` cannot assemble cross-vertical context
4. **Ontology type errors** — runtime type mismatches against `platform-ontology` definitions

## Triage

### Step 1: Identify affected subsystem

| Subsystem | Package | Check |
|-----------|---------|-------|
| Entity relationships | `platform-entity-graph` | Can entities be resolved by ID across verticals? |
| Knowledge store | `platform-knowledge-registry` | Are knowledge queries returning results? |
| Context assembly | `platform-context-orchestrator` | Is cross-vertical context available? |

### Step 2: Check data consistency

- Verify entity IDs are valid UUIDs and org-scoped
- Check for orphaned entity references (entity exists in one vertical but not the graph)
- Confirm ontology types match between producer and consumer

## Response

### Entity resolution failure

1. Verify the entity exists in the source system
2. Check if the entity graph index is stale — trigger reindex if needed
3. Confirm org-scoping: entity must belong to the requesting org

### Knowledge retrieval timeout

1. Check database connection pool health
2. Verify no long-running queries blocking the knowledge store
3. If index corruption suspected, rebuild knowledge index

### Context orchestration failure

1. Identify which verticals are unreachable
2. Check inter-package dependency health
3. Verify that required context providers are registered

## Verification

- Entity resolution returns correct, org-scoped results
- Knowledge queries complete within SLO targets
- Cross-vertical context assembly succeeds for test entities

## References

- Entity Graph: `packages/platform-entity-graph/`
- Knowledge Registry: `packages/platform-knowledge-registry/`
- Context Orchestrator: `packages/platform-context-orchestrator/`
- Ontology types: `packages/platform-ontology/src/types.ts`
