# Web (Marketing Site) — Demo Flow

## Demo Scenario: Marketing Site Operations

### Step 1: Login
- Sign in as `admin@demo-web.nzila.io`
- Verify dashboard loads with site analytics

### Step 2: Lead Capture
- Navigate to public landing page
- Fill lead form: "Jane Smith", "jane@example.com", "+1-555-0123"
- Submit — observe validation passes
- Attempt submission with invalid phone "abc" — observe rejection

### Step 3: XSS Protection
- Submit lead with name: `<script>alert('xss')</script>`
- Verify input is sanitized — script tags stripped

### Step 4: Content Publishing
- Navigate to Content Manager
- Create new article: "Getting Started with Nzila OS"
- Observe auto-generated slug: `getting-started-with-nzila-os`
- Set status to PUBLISHED
- Verify article appears on public site

### Step 5: Content Lifecycle
- Archive the article — status moves to ARCHIVED
- Verify article removed from public listing
- Re-publish — article returns to public listing

### Step 6: Evidence Export
- Export site data with evidence pack
- Verify SBOM, policy checks, and content audit trail included

### Demo Analytics
- Page views this month: 12,450
- Bounce rate: 34%
- Leads captured: 89
- Lead conversion rate: 12%
