# Nzila OS

> Monorepo for the Nzila digital-venture studio — public website, internal console, shared packages, governance docs, and automation tooling.

## Repository Map

```
├── apps/
│   ├── web/            → Public Next.js website (port 3000)
│   └── console/        → Clerk-gated internal console (port 3001)
├── packages/
│   ├── ui/             → Shared React component library (@nzila/ui)
│   ├── config/         → Shared TS, ESLint & Prettier configs (@nzila/config)
│   ├── scripts-book/   → Living standards / scripts-book templates
│   ├── automation/     → Python automation pipelines
│   └── analytics/      → Python analytics & reporting
├── content/
│   ├── public/         → Curated markdown rendered on the public website
│   └── internal/       → Curated markdown rendered inside the console
├── governance/         → Raw source-of-truth strategy & corporate docs (NEVER rendered directly)
│   ├── ai/
│   ├── business/
│   ├── corporate/
│   ├── docs/
│   └── knowledge/
├── ops/                → Operations runbooks & procedures
├── platform/           → Platform architecture & migration documentation
├── tech-repo-scaffold/ → Generated scaffolding & templates
└── .github/workflows/  → CI + Azure SWA deploy pipelines
```

### Key Rules

| Rule | Detail |
|------|--------|
| **Content boundary** | Apps read from `content/public` or `content/internal` — NEVER from `governance/` |
| **Auth** | Console uses [Clerk](https://clerk.com). Public site has no auth. |
| **Deployment** | Both apps deploy to Azure Static Web Apps via GitHub Actions |
| **Package manager** | pnpm ≥ 9 with workspaces |
| **Build orchestration** | Turborepo |
| **Styling** | Tailwind CSS v4 (PostCSS plugin) |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — `npm i -g pnpm`
- **Clerk account** (for the console) — [clerk.com](https://clerk.com)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
# Public website
cp apps/web/.env.example apps/web/.env.local

# Console (requires Clerk keys)
cp apps/console/.env.example apps/console/.env.local
# Then fill in NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
```

### 3. Run locally

```bash
# Both apps in parallel
pnpm dev

# Or individually
pnpm dev:web      # → http://localhost:3000
pnpm dev:console  # → http://localhost:3001
```

### 4. Build

```bash
pnpm build        # builds all apps + packages
pnpm build:web    # web only
pnpm build:console
```

### 5. Lint & Typecheck

```bash
pnpm lint
pnpm typecheck
```

---

## Content Authoring

### Public docs (`content/public/`)

Markdown files placed here are rendered at `nzila.app/resources/{slug}`.

```md
---
title: Getting Started
description: How to onboard onto the Nzila platform
category: Guides
order: 1
---

Your content here…
```

### Internal docs (`content/internal/`)

Markdown files placed here are rendered at `console.nzila.app/docs/{slug}` (requires auth).

Same frontmatter format as public docs.

---

## Azure Deployment

Both apps deploy via **Azure Static Web Apps**. See the workflow files:

- `.github/workflows/deploy-web.yml`
- `.github/workflows/deploy-console.yml`
- `.github/workflows/ci.yml`

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `AZURE_SWA_TOKEN_WEB` | SWA deployment token for the public website |
| `AZURE_SWA_TOKEN_CONSOLE` | SWA deployment token for the console |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (console build) |
| `CLERK_SECRET_KEY` | Clerk secret key (console build) |

### Required GitHub Variables

| Variable | Purpose |
|----------|---------|
| `CONSOLE_URL` | Public URL of the deployed console (used in web app) |

---

## Working with Packages

### `@nzila/ui`

Shared React components (Button, Card, Badge, Container, Sidebar). Import in any app:

```tsx
import { Button, Card } from '@nzila/ui'
```

### `@nzila/config`

Shared config files. Extend in `tsconfig.json`:

```json
{ "extends": "@nzila/config/tsconfig/nextjs" }
```

### `packages/automation/` & `packages/analytics/`

Python packages — run independently with their own virtual environments. See their respective README files.

---

## Architecture Decisions

- **Route groups**: The console uses a `(dashboard)` route group so that `/console`, `/docs`, `/analytics`, `/automation`, and `/standards` all share the sidebar layout without affecting URLs.
- **Markdown pipeline**: `gray-matter` parses frontmatter, `remark` + `remark-html` renders content. No MDX dependency.
- **RBAC**: Role-based access in the console via Clerk session claims (`publicMetadata.nzilaRole`). Five roles: `platform_admin`, `studio_admin`, `ops`, `analyst`, `viewer`.
- **Governance separation**: Raw strategy docs live in `governance/` and are never imported by application code. Curated versions go into `content/`.

---

## License

Proprietary — Nzila Digital Ventures. All rights reserved.
