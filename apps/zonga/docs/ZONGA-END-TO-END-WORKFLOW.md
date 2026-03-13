# Zonga — End-to-End Workflow Model

> Canonical reference for the Zonga music ecosystem platform.
> All implementation must align to the workflows defined in this document.

---

## 1. Platform Actors

| Actor | Description |
|-------|-------------|
| **Creator** | Artist, producer, or label uploading and monetizing content |
| **Listener** | Fan discovering, following, saving, and purchasing |
| **Operator** | Internal admin managing moderation, payouts, and platform integrity |
| **System** | Automated processes (webhooks, scheduled jobs, state machine transitions) |

---

## 2. Canonical Creator Workflow

```
1. CREATOR ONBOARDING
   ├─ creator invited or self-registers
   ├─ status: INVITED → REGISTERED
   ├─ completes profile (display name, bio, genre, country)
   ├─ status: REGISTERED → PROFILE_COMPLETE
   ├─ sets up payout method (Stripe Connect, M-Pesa, bank transfer)
   ├─ status: PROFILE_COMPLETE → PAYOUT_READY
   ├─ admin verifies identity (optional KYC gate)
   └─ status: PAYOUT_READY → ACTIVE

2. IDENTITY / PAYOUT READINESS
   ├─ payout rail configured (stripe_connect, mpesa, bank_transfer, etc.)
   ├─ payout currency set
   ├─ payout account reference validated
   └─ creator cannot receive payouts until PAYOUT_READY or ACTIVE

3. ASSET UPLOAD
   ├─ upload audio file to blob storage
   ├─ SHA-256 fingerprint computed
   ├─ quality tiers encoded (low, medium, high, lossless)
   ├─ cover art uploaded
   ├─ metadata entered (title, genre, language, ISRC, collaborators)
   └─ asset created in DRAFT status

4. RELEASE DRAFT
   ├─ group assets into a release (SINGLE, EP, ALBUM)
   ├─ set release date (optional scheduling)
   ├─ define royalty splits among collaborators
   ├─ attach cover art
   └─ release status: DRAFT

5. RELEASE REVIEW
   ├─ creator submits release for review
   ├─ release status: DRAFT → UNDER_REVIEW
   ├─ operator reviews content, metadata, rights
   ├─ integrity checks run (duplicate detection, rights conflicts)
   └─ operator decides: approve, hold, or reject

6. PUBLISH / SCHEDULE
   ├─ UNDER_REVIEW → PUBLISHED (immediate)
   ├─ UNDER_REVIEW → SCHEDULED (future date)
   ├─ SCHEDULED → PUBLISHED (on release date, by system)
   └─ published content becomes discoverable to listeners

7. AUDIENCE ENGAGEMENT
   ├─ creator sees follower count, play stats, favorites
   ├─ creator sees audience demographics (cities, countries)
   ├─ creator monitors release performance
   └─ creator responds to engagement signals

8. REVENUE EVENT INGESTION
   ├─ streams, downloads, tips, ticket sales, sync licenses recorded
   ├─ each event attributed to creator, asset, release
   ├─ revenue events are append-only ledger entries
   └─ currency and source tracked

9. ROYALTY SPLIT COMPUTATION
   ├─ release revenue distributed per royalty split configuration
   ├─ each collaborator's share computed proportionally
   ├─ platform fee deducted before distribution
   └─ split amounts visible to all parties

10. PAYOUT PREVIEW
    ├─ system computes available balance minus prior payouts
    ├─ preview shows gross revenue, platform fee, net payout
    ├─ preview must be locked before execution
    └─ preview status: DRAFT → READY → LOCKED

11. PAYOUT EXECUTION
    ├─ LOCKED preview triggers payout via configured rail
    ├─ Stripe Connect, M-Pesa, or bank transfer executed
    ├─ payout status: PENDING → PROCESSING → PAID or FAILED
    ├─ failed payouts can be retried
    └─ evidence pack generated for compliance

12. PAYOUT HISTORY / RECONCILIATION
    ├─ creator sees payout history with status, amount, date
    ├─ admin sees all payouts across creators
    ├─ reconciliation against revenue events
    └─ dispute workflow available for discrepancies
```

---

## 3. Canonical Listener Workflow

```
1. LISTENER VISITS PLATFORM
   ├─ lands on public discovery pages
   ├─ browses featured artists, new releases, trending playlists
   └─ no account required for browsing

2. DISCOVERS ARTIST / RELEASE / PLAYLIST / EVENT
   ├─ search by name, genre, region
   ├─ browse curated playlists
   ├─ explore event listings by city/country
   └─ only PUBLISHED and non-held content visible

3. FOLLOWS ARTIST
   ├─ listener follows a creator
   ├─ follow recorded as listener_follows entry
   ├─ listener sees followed artists in their account
   └─ follow contributes to creator audience metrics

4. SAVES / FAVORITES CONTENT
   ├─ listener favorites a track, release, playlist, or event
   ├─ favorites stored in listener_favorites
   ├─ playlists can be separately saved (listener_playlist_saves)
   └─ favorites visible in listener account area

5. BUYS TICKET
   ├─ listener selects event and ticket type
   ├─ Stripe checkout session created (status: PENDING)
   ├─ listener completes payment on Stripe
   └─ webhook confirms payment (status: CONFIRMED)

6. ATTENDS EVENT / RETAINS TICKET HISTORY
   ├─ confirmed tickets visible in listener ticket history
   ├─ event attendance tracked
   ├─ post-event status updates (COMPLETED)
   └─ ticket history is permanent record

7. RECEIVES UPDATE / NOTIFICATION
   ├─ followed artist releases new content → notification
   ├─ event reminder → notification
   ├─ ticket purchase confirmed → notification
   └─ in-app notification feed (v1)

8. CONTRIBUTES TO AUDIENCE AND MONETIZATION SIGNALS
   ├─ plays, views, follows, favorites recorded as listener_activity
   ├─ activity feeds into creator analytics
   ├─ ticket purchases feed into revenue events
   └─ engagement signals drive discovery ranking
```

---

## 4. Canonical Moderation Workflow

```
1. UPLOAD / RELEASE FLAGGED
   ├─ integrity signal raised (copyright, abuse, quality, policy, fraud)
   ├─ integrity_signals entry created
   └─ severity assessed (info, warning, critical)

2. OPERATOR REVIEW
   ├─ moderation_cases entry created linking to entity
   ├─ case assigned to operator
   ├─ case status: OPEN → IN_REVIEW
   └─ operator inspects content, metadata, history

3. APPROVE / REJECT / HOLD
   ├─ APPROVE: content released, case status → RESOLVED
   ├─ REJECT: content removed, case status → RESOLVED
   ├─ HOLD: content withheld pending further review, case status → ESCALATED
   └─ entity status updated accordingly (release: HELD, REJECTED, PUBLISHED)

4. RECORD RATIONALE
   ├─ operator records decision rationale in case notes
   ├─ audit event emitted for compliance
   └─ evidence pack generated for governance

5. UPDATE RELEASE OR ACCOUNT STATE
   ├─ release or asset status updated per decision
   ├─ creator account may be suspended if pattern detected
   ├─ payout hold flag set if financial risk identified
   └─ search/discovery index updated to reflect new state
```

---

## 5. Domain Entity Model

### Core Entities

| Entity | Primary Table | Purpose |
|--------|--------------|---------|
| Creator | `zonga_creators` | Artist/producer profiles |
| Creator Account | `zonga_creator_accounts` | Auth, onboarding, KYC |
| Catalog Asset | `zonga_content_assets` | Audio, video, cover art |
| Release | `zonga_releases` | Grouped content releases |
| Release Track | `zonga_release_tracks` | Track ordering within releases |
| Playlist | `zonga_playlists` | System, creator, or listener playlists |
| Playlist Item | `zonga_playlist_items` | Track/release ordering in playlists |
| Listener | `zonga_listeners` | Fan/audience profiles |
| Listener Follow | `zonga_listener_follows` | Creator follows |
| Listener Favorite | `zonga_listener_favorites` | Content favorites |
| Listener Playlist Save | `zonga_listener_playlist_saves` | Saved playlists |
| Listener Activity | `zonga_listener_activity` | Engagement events |
| Event | `zonga_events` | Live events |
| Ticket Type | `zonga_ticket_types` | Ticket pricing tiers |
| Ticket Purchase | `zonga_ticket_purchases` | Purchases with Stripe lifecycle |
| Revenue Event | `zonga_revenue_events` | Append-only revenue ledger |
| Royalty Split | `zonga_royalty_splits` | Revenue sharing config |
| Payout Preview | `zonga_payout_previews` | Computed pre-payout summaries |
| Payout | `zonga_payouts` | Executed payouts |
| Moderation Case | `zonga_moderation_cases` | Content/creator review cases |
| Integrity Signal | `zonga_integrity_signals` | Automated/manual flags |
| Notification | `zonga_notifications` | In-app notification records |

### Key Principle
- **audit_log** remains the audit trail — supplementary, not primary
- all core business state lives in dedicated domain tables
- every table is org-scoped via `org_id`

---

## 6. State Machines

### Creator Onboarding States
```
INVITED → REGISTERED → PROFILE_COMPLETE → PAYOUT_READY → ACTIVE
                                                          ↓
                                                      SUSPENDED
```

### Release Lifecycle States
```
DRAFT → UNDER_REVIEW → PUBLISHED
                     → SCHEDULED → PUBLISHED
                     → HELD → PUBLISHED
                            → REJECTED
PUBLISHED → ARCHIVED
```

### Event States
```
DRAFT → PUBLISHED → SOLD_OUT → COMPLETED
                  → CANCELLED
```

### Ticket Purchase States
```
PENDING → CONFIRMED → USED
        → FAILED
        → CANCELLED
CONFIRMED → REFUNDED
```

### Payout States
```
PENDING → PREVIEWED → APPROVED → PROCESSING → COMPLETED
                                             → FAILED → PENDING (retry)
Any non-terminal → CANCELLED
```

### Moderation Case States
```
OPEN → IN_REVIEW → RESOLVED
                 → DISMISSED
                 → ESCALATED → RESOLVED
```

---

## 7. Audit Events

### Creator Lifecycle
- `creator.invited`
- `creator.registered`
- `creator.profile_completed`
- `creator.payout_ready`
- `creator.activated`
- `creator.suspended`

### Release Lifecycle
- `release.created`
- `release.submitted_for_review`
- `release.published`
- `release.scheduled`
- `release.held`
- `release.rejected`
- `release.archived`

### Listener Actions
- `listener.registered`
- `listener.followed_creator`
- `listener.unfollowed_creator`
- `listener.favorited`
- `listener.unfavorited`
- `listener.saved_playlist`
- `listener.unsaved_playlist`

### Revenue / Payout
- `revenue.recorded`
- `payout.preview_generated`
- `payout.locked`
- `payout.executed`
- `payout.failed`
- `payout.retried`

### Moderation
- `moderation.case_created`
- `moderation.case_assigned`
- `moderation.case_resolved`
- `moderation.case_dismissed`
- `moderation.case_escalated`
- `moderation.content_held`
- `moderation.content_released`

### Events / Ticketing
- `event.created`
- `event.published`
- `event.cancelled`
- `event.completed`
- `ticket.purchased`
- `ticket.confirmed`
- `ticket.failed`
- `ticket.refunded`

---

## 8. Policy-Gated Actions

The following actions require governance policy checks:

| Action | Required Permission | Evidence Pack |
|--------|-------------------|---------------|
| Release publish override | `release:publish:override` | Yes |
| Content hold/release | `moderation:content:hold` | Yes |
| Payout execution | `payout:execute` | Yes |
| Payout hold/release | `payout:hold` | Yes |
| Event cancellation | `event:cancel` | Yes |
| Manual ticket correction | `ticket:manual_correct` | Yes |
| Creator suspension | `creator:suspend` | Yes |

---

## 9. Observability

All state transitions emit:
1. Structured log entry via `logger.info()`
2. Audit trail entry via `buildZongaAuditEvent()`
3. Commerce telemetry span via `logTransition()`
4. Evidence pack via `buildEvidencePackFromAction()` (for governance-critical actions)

---

## 10. Search / Discovery Rules

- Only `PUBLISHED` releases appear in public search
- `HELD`, `REJECTED`, `DRAFT`, `UNDER_REVIEW` content excluded
- `ARCHIVED` content excluded from primary discovery
- Events: only `PUBLISHED` and `SOLD_OUT` visible
- `CANCELLED` events visible with cancelled badge
- Moderation state filters apply before search results returned
