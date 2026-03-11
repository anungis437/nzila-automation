# CFO Dashboard — Demo Flow

## Demo Scenario: Financial Oversight Workflow

### Step 1: Login
- Sign in as `cfo@demo-finance.nzila.io`
- Verify dashboard renders with financial summaries

### Step 2: Review Financial Report
- Navigate to Reports
- Generate Q4 revenue/expense report
- Verify net income calculation: Revenue ($245,000) - Expenses ($189,500) = $55,500

### Step 3: Budget Monitoring
- Open Budget Tracker
- Show Operations budget: $120,000 allocated, $98,400 spent (82% utilization)
- Observe overrun warning on Marketing budget (103% utilization)

### Step 4: Ledger Adjustment (Policy Enforced)
- Submit a ledger adjustment for $12,000
- Observe dual-approval requirement from policy engine
- Approve with second finance_manager user

### Step 5: Budget Change (Threshold Enforcement)
- Attempt budget increase of $75,000 (above $50k threshold)
- Observe CFO approval requirement
- Approve with CFO role

### Step 6: Financial Export
- Export Q4 financial data as JSON
- Verify evidence pack includes SBOM, policy checks, and audit trail
- Show checksum validation

### Demo Analytics
- Monthly revenue trend: 12-month chart
- Budget health: 6 departments, 1 overrun
- Pending approvals: 3 ledger adjustments
