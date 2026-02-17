# Public Content

Curated markdown documents rendered on the **public website** at `/resources/{slug}`.

## Frontmatter Schema

```yaml
---
title: Document Title          # Required — displayed as page heading
description: Short summary     # Optional — shown in listings
category: Category Name        # Optional — used for grouping (default: "General")
order: 1                       # Optional — sort order within category
---
```

## Guidelines

- Keep content polished and suitable for external audiences.
- Subdirectories become slug prefixes (e.g., `guides/onboarding.md` → `/resources/guides/onboarding`).
- Images should be placed in `apps/web/public/` and referenced with absolute paths.
- **Never** copy raw governance docs here without review and editing.
