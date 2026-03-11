# Partners Portal — Demo Flow

## Demo Scenario: Partner Lifecycle Management

### Step 1: Login
- Sign in as `admin@demo-partners.nzila.io`
- Verify dashboard shows partner overview

### Step 2: Onboard New Partner
- Click "Add Partner"
- Fill partner details: Acme Corp, contact@acme.com, Gold tier
- Submit — observe PENDING status and unique ID assignment
- Approve onboarding as partner_admin

### Step 3: Upload Contract
- Select Acme Corp partner
- Upload contract: `acme-partnership-2025.pdf` (2.1 MB)
- Verify file type validation (PDF accepted)
- Attempt upload of `.exe` file — observe rejection

### Step 4: Revenue Tracking
- Navigate to Revenue Dashboard
- Show Acme Corp: base commission 15% + Gold tier bonus 3%
- View monthly revenue: Jan $12,500, Feb $14,200, Mar $11,800
- Verify 3-month aggregate: $38,500

### Step 5: Revenue Modification (Policy Enforced)
- Attempt commission adjustment of $7,500 (above $5k threshold)
- Observe manager approval requirement from policy engine
- Approve with partner_manager role

### Step 6: Evidence Export
- Export partner data with evidence pack
- Verify SBOM, policy checks, and audit trail included

### Demo Analytics
- Active partners: 12
- Contracts pending review: 3
- Monthly revenue: $142,000
- Top partner by revenue: Demo Partner Alpha ($28,500/month)
