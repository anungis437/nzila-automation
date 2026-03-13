# Zonga — Governance & Content Policy

> Policies governing content moderation, creator management, revenue integrity,
> and platform safety for the Zonga music ecosystem.

---

## 1. Content Moderation Policy

### 1.1 Integrity Signal Types

| Signal Type | Description | Auto-action |
|-------------|-------------|-------------|
| `copyright` | Duplicate fingerprint or rights claim detected | Hold for review |
| `abuse` | Hate speech, harmful content, or harassment | Hold for review |
| `quality` | Audio quality below minimum threshold | Warning to creator |
| `policy` | Terms of service violation | Hold for review |
| `fraud` | Suspicious revenue patterns or fake engagement | Hold + payout freeze |

### 1.2 Moderation Case Workflow

```
Signal raised → Case created (OPEN)
              → Operator assigned (IN_REVIEW)
              → Decision:
                  APPROVE → content released, case RESOLVED
                  REJECT  → content removed, case RESOLVED
                  HOLD    → content withheld, case ESCALATED
                  DISMISS → false positive, case DISMISSED
```

### 1.3 Response Time SLOs

| Severity | Target Response | Target Resolution |
|----------|----------------|-------------------|
| Critical (fraud, abuse) | 4 hours | 24 hours |
| Warning (copyright, policy) | 24 hours | 72 hours |
| Info (quality) | 72 hours | 1 week |

### 1.4 Escalation Path

1. **Auto-detection** → Integrity signal created
2. **Operator review** → Case opened and assigned
3. **Senior operator** → Escalated cases requiring judgment calls
4. **Platform admin** → Creator suspension, payout holds, account actions

---

## 2. Creator Management Policy

### 2.1 Onboarding Gates

| Gate | Required for | Enforced by |
|------|-------------|-------------|
| Profile complete | Content upload | `creator.status >= PROFILE_COMPLETE` |
| Payout configured | Revenue receipt | `creator.status >= PAYOUT_READY` |
| Identity verified | Full platform access | Optional KYC gate |
| Active status | Public visibility | `creator.status = ACTIVE` |

### 2.2 Suspension Policy

A creator may be suspended for:
- Repeated copyright violations (3+ resolved cases)
- Confirmed fraud or fake engagement
- Terms of service violation after warning
- Payment reversal patterns

Suspension effects:
- All releases moved to HELD status
- Payouts frozen
- Public profile hidden from discovery
- Existing ticket purchases honored

### 2.3 Reinstatement

- Creator may appeal after 30 days
- Reinstatement requires operator review
- Previous moderation history visible to reviewers

---

## 3. Revenue Integrity Policy

### 3.1 Revenue Event Principles

- Revenue events are **append-only** — never modified or deleted
- Every event attributed to: creator, asset, release, org
- Currency and source tracked for reconciliation
- Platform fee computed at payout time, not at event time

### 3.2 Anti-Fraud Signals

| Signal | Detection Method | Action |
|--------|-----------------|--------|
| Play count anomaly | Statistical outlier detection | Flag for review |
| Tip velocity spike | Rate limiting per listener | Throttle + review |
| Self-play patterns | Same actor as creator and listener | Exclude from revenue |
| Geographic impossible | Plays from impossible time/location combinations | Flag for review |

### 3.3 Payout Controls

- Payouts require preview → lock → execute workflow
- Lock prevents modification during processing
- Failed payouts enter retry queue (max 3 retries)
- All payout executions generate evidence packs
- Minimum payout threshold: configurable per org

---

## 4. Release Publishing Policy

### 4.1 Pre-Publication Checks

| Check | Required | Blocks publish |
|-------|----------|---------------|
| Audio file uploaded | ✅ | Yes |
| Cover art attached | ✅ | Yes |
| Metadata complete (title, genre) | ✅ | Yes |
| ISRC assigned | Optional | No |
| Collaborator splits defined | If collaborators exist | Yes |
| No pending integrity signals | ✅ | Yes |

### 4.2 State Machine Rules

- Only valid transitions allowed (enforced by `attemptTransition()`)
- `DRAFT → UNDER_REVIEW`: Creator-initiated submission
- `UNDER_REVIEW → PUBLISHED`: Operator approval
- `UNDER_REVIEW → HELD`: Operator hold for further review
- `HELD → PUBLISHED`: Operator release after review
- `HELD → REJECTED`: Operator final rejection
- `PUBLISHED → ARCHIVED`: Creator or operator archival
- Override: `release:publish:override` permission required for bypass

### 4.3 Scheduled Releases

- `UNDER_REVIEW → SCHEDULED`: Approved with future release date
- `SCHEDULED → PUBLISHED`: System-triggered on release date
- Scheduled releases visible to creator but not to listeners until publish date

---

## 5. Event & Ticketing Policy

### 5.1 Event Publication

- Events require: title, date, venue, at least one ticket type
- Only `PUBLISHED` events visible to listeners
- Events auto-transition to `COMPLETED` after event date + 24h

### 5.2 Ticket Purchase Integrity

- Stripe Checkout enforces payment verification
- Ticket status follows Stripe webhook confirmations
- Refunds processed through Stripe (not manual)
- Over-selling prevention via `available_quantity` decrement

### 5.3 Cancellation Policy

- Event cancellation requires `event:cancel` permission
- All confirmed ticket holders notified
- Automatic refund process initiated via Stripe
- Evidence pack generated for compliance

---

## 6. Data Governance

### 6.1 Org Isolation

- Every domain table has `org_id` column
- Every query filters by org context from `resolveOrgContext()`
- Public marketing queries are cross-org (read-only, published content only)
- No cross-org writes are permitted

### 6.2 Audit Trail

- All governance-critical actions emit audit_log entries
- Evidence packs generated for: publish overrides, content holds, payout executions, event cancellations, creator suspensions
- Audit events include actor, timestamp, org context, and action metadata

### 6.3 Data Retention

- Revenue events: permanent (append-only ledger)
- Audit log: permanent
- Moderation cases: permanent (compliance requirement)
- Listener activity: 2 years (configurable)
- Notifications: 90 days (soft delete)

---

## 7. Permission Matrix

| Action | Permission Key | Evidence Pack |
|--------|---------------|---------------|
| Publish release (override) | `release:publish:override` | ✅ |
| Hold content | `moderation:content:hold` | ✅ |
| Release held content | `moderation:content:release` | ✅ |
| Execute payout | `payout:execute` | ✅ |
| Hold payout | `payout:hold` | ✅ |
| Cancel event | `event:cancel` | ✅ |
| Manual ticket correction | `ticket:manual_correct` | ✅ |
| Suspend creator | `creator:suspend` | ✅ |
| Reinstate creator | `creator:reinstate` | ✅ |
| Assign moderation case | `moderation:case:assign` | No |
| View analytics | `analytics:view` | No |
| View revenue | `revenue:view` | No |
