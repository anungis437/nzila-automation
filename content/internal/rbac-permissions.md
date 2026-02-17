---
title: RBAC & Permissions
description: Role-based access control model for the Nzila console.
category: Security
order: 2
---

# RBAC & Permissions

The console uses Clerk session claims to enforce role-based access.

## How Roles Work

Each user has a `nzilaRole` property in their Clerk `publicMetadata`. The console reads this at request time via `auth().sessionClaims`.

## Available Roles

| Role | Description |
|------|-------------|
| `platform_admin` | Full unrestricted access. Can manage users, deploy, and configure all systems. |
| `studio_admin` | Access to all content, analytics, and documentation. Cannot manage infrastructure. |
| `ops` | Operations — access to automation pipelines, deployments, and monitoring. |
| `analyst` | Read-only access to analytics dashboards and reports. |
| `viewer` | Read-only access to internal documentation only. |

## Assigning Roles

Roles are assigned via the Clerk Dashboard:

1. Navigate to **Users** in your Clerk dashboard.
2. Select a user → **Public Metadata**.
3. Set: `{ "nzilaRole": "analyst" }`.

## Code Reference

The RBAC utilities live in `apps/console/lib/rbac.ts`:

- `getUserRole()` — Returns the current user's role from session claims.
- `requireRole(...roles)` — Throws a 403 if the user doesn't have one of the specified roles.
- `hasRole(...roles)` — Returns a boolean without throwing.
