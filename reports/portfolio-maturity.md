# NzilaOS Portfolio Maturity Matrix

> Generated: 2026-03-10T20:47:16.799Z

| Maturity | Count |
|----------|-------|
| production-grade | 9 |
| pilot-grade | 5 |
| internal/admin | 1 |
| scaffold | 1 |

## App Assessment

| App | Maturity | Score | MW | RL | RID | Core | Health | Tests | Env | APIs | Gaps |
|-----|----------|-------|----|----|-----|------|--------|-------|-----|------|------|
| abr | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 2 | — |
| cfo | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 | — |
| console | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 70 | — |
| cora | pilot-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| nacp-exams | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3 | — |
| partners | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3 | — |
| platform-admin | internal/admin | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| pondu | pilot-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| shop-quoter | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 5 | — |
| trade | pilot-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| web | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| zonga | production-grade | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | — |
| mobility | pilot-grade | 7/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 1 | no test files |
| mobility-client-portal | pilot-grade | 7/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 1 | no test files |
| union-eyes | production-grade | 7/8 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 1190 | middleware missing rate limiting |
| orchestrator-api | scaffold | 3/8 | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | 0 | no middleware.ts, no /api/health route, no API routes |

## Legend

- **MW**: middleware.ts present
- **RL**: Rate limiting in middleware
- **RID**: Request-ID propagation
- **Core**: @nzila/os-core dependency
- **Health**: /api/health route
- **Tests**: Test files present
- **Env**: Zod env schema in os-core
- **APIs**: Number of API route files
