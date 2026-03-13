# Domain Model — Zonga

> Canonical reference for Zonga domain entities, state machines,
> events, and audit surfaces. See also: docs/DOMAIN_VS_AUDIT_MODEL.md

## Primary Entities

| Entity | Table(s) | Purpose |
|--------|----------|---------|
| Catalog | `catalogs` | Music / content catalogue |
| Creator | `creators` | Content creator / artist |
| Release | `releases` | Published release (album, single, EP) |
| Playlist | `playlists` | Curated playlist |
| Listener | `listeners` | Platform user / listener |
| Event | `events` | Live event / concert |
| Upload | `uploads` | Content upload |
| Payout | `payouts`, `revenue` | Revenue distribution |
| Moderation | `moderation_notifications` | Content moderation case |

## Primary State Tables (Source of Truth)

- `releases` — current release status, metadata, distribution
- `creators` — current creator profile, verification, payout config
- `catalogs` — current catalogue structure, ownership
- `payouts` — current payout status, amounts, schedule
- `uploads` — current upload status, processing state
- `moderation_notifications` — current moderation decisions

## Workflow State Machines

| State Machine | File | States |
|---------------|------|--------|
| Release | `lib/workflows/release-state-machine.ts` | draft → submitted → review → approved → distributed / rejected |

## Emitted Events

| Event | Trigger | Consumer |
|-------|---------|----------|
| `release.submitted` | Creator submits release | Moderation, Audit |
| `release.approved` | Release passes review | Distribution, Notifications |
| `release.distributed` | Release goes live | Analytics, Revenue |
| `payout.processed` | Revenue distributed | Finance, Notifications |
| `upload.completed` | File upload finished | Processing pipeline |
| `moderation.flagged` | Content flagged | Moderation queue, Audit |

## Audit Surfaces

| Surface | Purpose | Tables |
|---------|---------|--------|
| Release audit trail | Track release lifecycle | `audit_entries` |
| Moderation log | Moderation decision history | `audit_entries` |
| Revenue audit | Payout calculation proof | `audit_entries` |
| Evidence export | Compliance evidence pack | `evidence_packs` |

## What is NOT a Source of Truth

| Data | Why Not |
|------|---------|
| `audit_entries` | Historical record only — do not query for current release/creator state |
| `evidence_packs` | Export artefacts — not primary data source |
| Revenue audit entries | Calculation proof — current payout state lives in `payouts` table |
| Moderation audit trail | Decision history — current moderation state lives in `moderation_notifications` |
