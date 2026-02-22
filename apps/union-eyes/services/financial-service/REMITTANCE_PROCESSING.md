# Remittance Processing System

**Automated File Upload, Parsing & Reconciliation**

## Overview

The Remittance Processing System automates the handling of employer bulk payment files. It supports multiple file formats (CSV, Excel, XML), intelligently matches payments to dues transactions, detects variances, and generates comprehensive reconciliation reports.

## Features

### 1. Multi-Format File Parsing

**Supported Formats:**

- **CSV** (.csv) - Comma or custom delimited
- **Excel** (.xlsx, .xls) - Microsoft Excel workbooks
- **XML** (.xml) - XML/EDI formats

**Parser Features:**

- Configurable field mapping
- Flexible date format parsing
- Currency symbol handling ($, commas)
- Header row detection
- Skip lines configuration
- Validation rules (min/max amounts)

### 2. Intelligent Auto-Reconciliation

**Matching Algorithm:**
The reconciliation engine uses a confidence-based scoring system:

- **Member ID Match** (40 points): Exact match on member number or employee ID
- **Period Match** (30 points): Exact billing period alignment
- **Period Overlap** (15 points): Partial credit for overlapping periods
- **Amount Match** (30 points): Exact within tolerance
- **Fuzzy Amount** (20 points): Within percentage tolerance
- **Close Amount** (10 points): Within 5% variance

**Minimum Confidence:** 50% required for auto-match

### 3. Variance Detection

**Variance Types:**

- **Overpayment**: Remittance amount exceeds transaction amount
- **Underpayment**: Remittance amount below transaction amount
- **Missing Transaction**: Remittance record has no matching transaction
- **Unmatched Remittance**: Transaction exists but no remittance record

**Tolerance Settings:**

- Absolute tolerance: Default $0.01 (configurable)
- Percentage tolerance: Default 0.5% (configurable)

### 4. Reconciliation Reporting

**Report Formats:**

- **JSON**: Structured data for API consumption
- **Text**: Human-readable plain text report

**Report Contents:**

- Summary statistics (total amounts, variance, match rate)
- Detailed match list with confidence scores
- Variance breakdown with descriptions
- Unmatched items (both transactions and remittance records)

---

## API Endpoints

### Upload Remittance File

**POST** `/api/remittances/upload`

Upload and parse a remittance file.

**Headers:**

```
X-Test-User: {"userId":"...", "tenantId":"...", "role":"admin"}
Content-Type: multipart/form-data
```

**Body (multipart form):**

- `file`: The remittance file (CSV, Excel, or XML)
- `config` (optional): JSON parser configuration

**Parser Config Example:**

```json
{
  "csvDelimiter": ",",
  "csvHasHeader": true,
  "csvSkipLines": 0,
  "fieldMapping": {
    "employeeId": "employee_id",
    "grossWages": "gross_wages",
    "duesAmount": "dues_amount",
    "billingPeriodStart": "period_start",
    "billingPeriodEnd": "period_end"
  },
  "minDuesAmount": 0,
  "maxDuesAmount": 10000,
  "requireEmployeeId": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "fileName": "remittance-oct-2024.csv",
    "fileSize": 15234,
    "parsedRecords": [
      {
        "employeeId": "EMP001",
        "employeeName": "John Doe",
        "memberNumber": "M001",
        "grossWages": 5000.00,
        "duesAmount": 100.00,
        "billingPeriodStart": "2024-10-01T00:00:00.000Z",
        "billingPeriodEnd": "2024-10-31T00:00:00.000Z",
        "hoursWorked": 160,
        "rawLineNumber": 2
      }
    ],
    "summary": {
      "totalRecords": 150,
      "validRecords": 148,
      "invalidRecords": 2,
      "totalDuesAmount": 15800.00,
      "totalGrossWages": 750000.00
    },
    "errors": [
      {
        "line": 45,
        "message": "Invalid amount: abc",
        "rawData": {...}
      }
    ]
  }
}
```

---

### Create Remittance Record

**POST** `/api/remittances`

Create a remittance record after parsing.

**Request Body:**

```json
{
  "employerId": "uuid",
  "batchNumber": "BATCH-2024-10",
  "billingPeriodStart": "2024-10-01",
  "billingPeriodEnd": "2024-10-31",
  "totalAmount": 15800.00,
  "totalMembers": 150,
  "remittanceDate": "2024-11-01",
  "paymentMethod": "ach",
  "referenceNumber": "ACH123456",
  "notes": "October 2024 payroll deduction"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rem-uuid",
    "batchNumber": "BATCH-2024-10",
    "processingStatus": "pending",
    "createdAt": "2024-11-16T..."
  }
}
```

---

### Reconcile Remittance

**POST** `/api/remittances/:id/reconcile`

Auto-reconcile remittance records with dues transactions.

**Request Body:**

```json
{
  "records": [...], // Parsed records from upload
  "autoApply": true, // Automatically update matched transactions
  "toleranceAmount": 0.01,
  "tolerancePercentage": 0.5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reconciliation": {
      "remittanceId": "rem-uuid",
      "summary": {
        "totalRemittanceAmount": 15800.00,
        "totalTransactionAmount": 15750.00,
        "totalVariance": 50.00,
        "matchedCount": 145,
        "unmatchedRemittanceCount": 3,
        "unmatchedTransactionCount": 2,
        "varianceCount": 5,
        "autoMatchRate": 96.7
      },
      "matches": [
        {
          "transactionId": "tx-uuid",
          "remittanceLineNumber": 2,
          "matchType": "exact",
          "confidence": 100,
          "amountVariance": 0.00,
          "memberIdMatch": true,
          "periodMatch": true
        }
      ],
      "variances": [
        {
          "type": "overpayment",
          "remittanceLineNumber": 45,
          "transactionId": "tx-uuid",
          "memberId": "mem-uuid",
          "employeeId": "EMP045",
          "expectedAmount": 100.00,
          "actualAmount": 105.00,
          "varianceAmount": 5.00,
          "variancePercentage": 5.0,
          "description": "Overpayment of $5.00"
        }
      ],
      "unmatchedRemittances": [...],
      "unmatchedTransactions": [...]
    },
    "report": "=== REMITTANCE RECONCILIATION REPORT ===\n..."
  }
}
```

---

### Get Reconciliation Report

**GET** `/api/remittances/:id/report?format=json|text`

Generate a reconciliation report.

**Query Parameters:**

- `format`: `json` (default) or `text`

**JSON Response:**

```json
{
  "success": true,
  "data": {
    "remittance": {...},
    "transactions": [...],
    "summary": {
      "matchedCount": 145,
      "totalReconciled": 15750.00,
      "variance": 50.00
    }
  }
}
```

**Text Response:**

```
=== REMITTANCE REPORT ===

Batch Number: BATCH-2024-10
Remittance Date: 2024-11-01
Total Amount: $15800.00
Total Members: 150
Status: completed

--- Matched Transactions ---
mem-001: $100.00 - paid (2024-11-01)
mem-002: $120.00 - paid (2024-11-01)
...

Total Matched: 145
Total Reconciled: $15750.00
Variance: $50.00

=== END OF REPORT ===
```

---

## File Format Examples

### CSV Format

```csv
employee_id,employee_name,member_number,gross_wages,dues_amount,period_start,period_end,hours_worked
EMP001,John Doe,M001,5000.00,100.00,2024-10-01,2024-10-31,160
EMP002,Jane Smith,M002,6000.00,120.00,2024-10-01,2024-10-31,160
EMP003,Bob Johnson,M003,4500.00,90.00,2024-10-01,2024-10-31,160
```

**Field Mapping:**

- `employee_id` → Employee identifier
- `employee_name` → Full name (optional)
- `member_number` → Union member number (optional, used for matching)
- `gross_wages` → Total earnings for period
- `dues_amount` → Calculated dues deduction
- `period_start` → Billing period start date
- `period_end` → Billing period end date
- `hours_worked` → Total hours (optional)

### XML Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Remittance>
  <Employees>
    <Employee>
      <employeeId>EMP001</employeeId>
      <employeeName>John Doe</employeeName>
      <memberNumber>M001</memberNumber>
      <grossWages>5000.00</grossWages>
      <duesAmount>100.00</duesAmount>
      <periodStart>2024-10-01</periodStart>
      <periodEnd>2024-10-31</periodEnd>
      <hoursWorked>160</hoursWorked>
    </Employee>
  </Employees>
</Remittance>
```

### Excel Format

Same structure as CSV but in `.xlsx` format. Supports:

- Multiple sheets (uses first sheet)
- Header row detection
- Formula evaluation
- Cell formatting

---

## Reconciliation Workflow

### Step 1: Upload File

1. Admin uploads remittance file via API
2. Parser validates and extracts records
3. System returns parsed data with summary

### Step 2: Create Remittance

1. Admin creates remittance record
2. System stores metadata (batch number, employer, totals)
3. Initial status: `pending`

### Step 3: Auto-Reconcile

1. System fetches dues transactions for billing period
2. Reconciliation engine matches records:
   - Scores each potential match (0-100 confidence)
   - Selects best matches above 50% threshold
   - Detects variances (amount, period, member ID)
3. If `autoApply=true`, updates matched transactions:
   - Sets `remittanceId`
   - Changes status to `paid`
   - Records `paidDate`
4. Returns reconciliation result with matches and variances

### Step 4: Review & Resolve

1. Admin reviews reconciliation report
2. For variances:
   - **Overpayment**: Manual refund or credit forward
   - **Underpayment**: Request additional payment
   - **Missing Transaction**: Create transaction manually
   - **Unmatched Remittance**: Investigate employer data
3. Admin can manually match remaining items
4. Update remittance status to `completed` or `needs_review`

---

## Configuration

### Parser Configuration

**CSV Options:**

```typescript
{
  csvDelimiter: ',',           // Column separator
  csvHasHeader: true,          // First row contains headers
  csvSkipLines: 0,             // Lines to skip before data
}
```

**Field Mapping:**

```typescript
{
  fieldMapping: {
    employeeId: 'employee_id',           // String (column name) or number (index)
    employeeName: 'employee_name',
    memberNumber: 'member_number',
    grossWages: 'gross_wages',
    duesAmount: 'dues_amount',
    billingPeriodStart: 'period_start',
    billingPeriodEnd: 'period_end',
    hoursWorked: 'hours_worked',
    overtimeHours: 'overtime_hours',
  }
}
```

**Validation Rules:**

```typescript
{
  minDuesAmount: 0,            // Minimum valid dues amount
  maxDuesAmount: 10000,        // Maximum valid dues amount
  requireEmployeeId: true,     // Reject records without employee ID
}
```

### Reconciliation Tolerances

```typescript
{
  toleranceAmount: 0.01,       // Allow $0.01 variance
  tolerancePercentage: 0.5,    // Allow 0.5% variance
}
```

**Examples:**

- Transaction: $100.00, Remittance: $100.01 → Exact match (within $0.01)
- Transaction: $1000.00, Remittance: $1004.00 → Exact match (0.4% < 0.5%)
- Transaction: $100.00, Remittance: $105.00 → Fuzzy match (5% variance flagged)

---

## Error Handling

### Parse Errors

**Invalid Amount:**

```json
{
  "line": 45,
  "field": "duesAmount",
  "message": "Invalid amount: abc",
  "rawData": {...}
}
```

**Missing Required Field:**

```json
{
  "line": 67,
  "message": "Missing required fields: grossWages, duesAmount",
  "rawData": {...}
}
```

**Date Parse Error:**

```json
{
  "line": 89,
  "field": "billingPeriodStart",
  "message": "Invalid date: 13/45/2024",
  "rawData": {...}
}
```

### Reconciliation Issues

**No Matches Found:**

- Check member IDs are correct
- Verify billing period alignment
- Confirm transactions exist in system

**Low Match Rate:**

- Review field mapping configuration
- Check for data quality issues
- Adjust tolerance settings

**High Variance Count:**

- Investigate employer calculation errors
- Review dues rule changes
- Check for manual adjustments

---

## Testing

Run the test suite:

```powershell
cd services/financial-service
./test-remittances.ps1
```

**Test Coverage:**

1. ✓ Create CSV file
2. ✓ Upload and parse CSV
3. ✓ Create remittance record
4. ✓ Create test transactions
5. ✓ Auto-reconcile
6. ✓ Generate JSON report
7. ✓ Generate text report
8. ✓ Excel format support
9. ✓ XML parsing

---

## Best Practices

### For Employers

1. **Consistent Format**: Use same file format and field names each period
2. **Include Member Numbers**: Enables higher confidence matching
3. **Match Billing Periods**: Align dates with union's billing cycle
4. **Validate Calculations**: Review totals before submission
5. **Reference Numbers**: Include check/ACH numbers for audit trail

### For Union Admins

1. **Review Before Auto-Apply**: Check parsed data before reconciliation
2. **Set Appropriate Tolerances**: Balance automation vs. accuracy
3. **Investigate Variances**: Don't ignore discrepancies
4. **Document Resolutions**: Add notes to variance records
5. **Monthly Reconciliation**: Process remittances promptly

### For Developers

1. **Field Mapping**: Document employer-specific mappings
2. **Error Handling**: Log parse errors for troubleshooting
3. **Performance**: Batch process large files (10,000+ records)
4. **Audit Trail**: Store original file and parsed data
5. **Testing**: Use production-like data volumes

---

## Future Enhancements

**Phase 5 (Planned):**

- GL (General Ledger) posting integration
- Duplicate detection across batches
- Partial reconciliation (match subset of records)
- Machine learning for improved matching
- Employer portal for self-service upload
- Real-time validation feedback
- Automated variance dispute workflow
- Multi-tenant employer configurations

---

## Technical Architecture

### Components

```
┌─────────────────────┐
│   API Endpoint      │
│  POST /upload       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ RemittanceParser    │
│  - CSV Parser       │
│  - Excel Parser     │
│  - XML Parser       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validation Layer    │
│  - Field mapping    │
│  - Amount validation│
│  - Date parsing     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ReconciliationEngine│
│  - Matching algo    │
│  - Variance detect  │
│  - Confidence score │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Database Update   │
│  - Match txns       │
│  - Update status    │
│  - Store variances  │
└─────────────────────┘
```

### Dependencies

- **xlsx**: Excel file parsing
- **csv-parse**: CSV parsing
- **fast-xml-parser**: XML parsing
- **multer**: File upload handling
- **drizzle-orm**: Database operations

---

## Support

For issues or questions:

1. Check test suite output: `./test-remittances.ps1`
2. Review parser errors in API response
3. Verify file format matches documentation
4. Test with small sample file first
5. Contact development team with file sample

---

**Version:** 1.0.0  
**Last Updated:** November 16, 2025  
**Status:** Production Ready ✅
