# NzilaOS Portfolio Maturity Matrix

> Generated: 2026-03-10T19:24:27.955Z

| Maturity | Count |
|----------|-------|
| production | 15 |
| integration-ready | 0 |
| scaffold | 1 |
| placeholder | 0 |

## App Assessment

| App | Maturity | Score | MW | RL | RID | Core | Health | Tests | Env | APIs | Gaps |
|-----|----------|-------|----|----|-----|------|--------|-------|-----|------|------|
| abr | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 2 | — |
| cfo | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 | — |
| console | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 70 | — |
| cora | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| nacp-exams | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3 | — |
| partners | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3 | — |
| platform-admin | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| pondu | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| shop-quoter | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 5 | — |
| trade | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| web | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 1 | — |
| zonga | production | 8/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | — |
| mobility | production | 7/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 1 | no test files |
| mobility-client-portal | production | 7/8 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 1 | no test files |
| union-eyes | production | 7/8 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 1190 | middleware missing rate limiting |
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
