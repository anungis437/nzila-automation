# Arrears Detection Test Script
# Tests automated detection of overdue payments

$baseUrl = "http://localhost:3007"
$testUser = @{
    userId = "test-admin-001"
    tenantId = "11111111-1111-1111-1111-111111111111"
    role = "admin"
} | ConvertTo-Json -Compress
$headers = @{
    "Content-Type" = "application/json"
    "X-Test-User" = $testUser
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Arrears Detection Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Detect overdue payments (preview only, no case creation)
Write-Host "[Test 1] POST /api/arrears/detect - Preview overdue payments" -ForegroundColor Yellow
try {
    $body = @{
        gracePeriodDays = 0  # Detect all pending transactions
        createCases = $false  # Preview only
        applyLateFees = $false
    } | ConvertTo-Json -Depth 5

    $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears/detect" -Method Post -Headers $headers -Body $body
    
    if ($response.success) {
        Write-Host "  Status: SUCCESS" -ForegroundColor Green
        Write-Host "  Detected Members: $($response.data.detectedCount)"
        Write-Host "  Total Owing: `$$($response.data.totalOwing)"
        
        if ($response.data.detectedArrears) {
            Write-Host "  Member Details:"
            foreach ($arrears in $response.data.detectedArrears) {
                $memberId = $arrears.memberId.Substring(0, 8) + "..."
                Write-Host "    - Member: $memberId, Owing: `$$($arrears.totalOwing), Days: $($arrears.daysOverdue), Transactions: $($arrears.transactionCount)"
            }
        }
    } else {
        Write-Host "  Status: FAILED" -ForegroundColor Red
        Write-Host "  Error: $($response.error)"
    }
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 2: Create arrears cases with late fees
Write-Host "[Test 2] POST /api/arrears/detect - Create cases with late fees" -ForegroundColor Yellow
try {
    $body = @{
        gracePeriodDays = 0
        createCases = $true
        applyLateFees = $true
        lateFeePercentage = 5.0  # 5% late fee
        lateFeeFixedAmount = 10.0  # Plus $10 fixed fee
        escalationThresholds = @{
            level1Days = 30
            level2Days = 60
            level3Days = 90
            level4Days = 120
        }
    } | ConvertTo-Json -Depth 5

    $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears/detect" -Method Post -Headers $headers -Body $body
    
    if ($response.success) {
        Write-Host "  Status: SUCCESS" -ForegroundColor Green
        Write-Host "  Cases Created: $($response.data.casesCreated.Count)"
        Write-Host "  Total Owing: `$$($response.data.totalOwing)"
        Write-Host "  Late Fees Applied: `$$($response.data.feesApplied)"
        
        if ($response.data.casesCreated.Count -gt 0) {
            $global:testCaseId = $response.data.casesCreated[0]
            Write-Host "  First Case ID: $($global:testCaseId.Substring(0, 8))..."
        }
    } else {
        Write-Host "  Status: FAILED" -ForegroundColor Red
        Write-Host "  Error: $($response.error)"
    }
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 3: List all arrears cases
Write-Host "[Test 3] GET /api/arrears - List all cases" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears" -Method Get -Headers $headers
    
    if ($response.success) {
        Write-Host "  Status: SUCCESS" -ForegroundColor Green
        Write-Host "  Total Cases: $($response.data.Count)"
        
        if ($response.data.Count -gt 0) {
            Write-Host "  Sample Cases:"
            foreach ($case in $response.data | Select-Object -First 3) {
                $memberId = $case.memberId.Substring(0, 8) + "..."
                Write-Host "    - Case: $($case.caseNumber), Member: $memberId, Owing: `$$($case.totalOwing), Status: $($case.arrearsStatus)"
            }
        }
    } else {
        Write-Host "  Status: FAILED" -ForegroundColor Red
        Write-Host "  Error: $($response.error)"
    }
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 4: Get specific arrears case
if ($global:testCaseId) {
    Write-Host "[Test 4] GET /api/arrears/:id - Get case details" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears/$global:testCaseId" -Method Get -Headers $headers
        
        if ($response.success) {
            Write-Host "  Status: SUCCESS" -ForegroundColor Green
            Write-Host "  Case Number: $($response.data.case.caseNumber)"
            Write-Host "  Total Owing: `$$($response.data.case.totalOwing)"
            Write-Host "  Months Overdue: $($response.data.case.monthsInArrears)"
            Write-Host "  Status: $($response.data.case.arrearsStatus)"
            Write-Host "  Has Payment Plan: $($response.data.case.hasPaymentPlan)"
        } else {
            Write-Host "  Status: FAILED" -ForegroundColor Red
            Write-Host "  Error: $($response.error)"
        }
    } catch {
        Write-Host "  Status: ERROR" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

# Test 5: Update arrears case status (escalation)
if ($global:testCaseId) {
    Write-Host "[Test 5] PUT /api/arrears/:id/status - Escalate to payment plan" -ForegroundColor Yellow
    try {
        $body = @{
            status = "payment_plan"
            notes = "Member contacted, agreed to payment plan"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears/$global:testCaseId/status" -Method Put -Headers $headers -Body $body
        
        if ($response.success) {
            Write-Host "  Status: SUCCESS" -ForegroundColor Green
            Write-Host "  Updated Status: $($response.data.arrearsStatus)"
            Write-Host "  Notes: $($response.data.notes)"
        } else {
            Write-Host "  Status: FAILED" -ForegroundColor Red
            Write-Host "  Error: $($response.error)"
        }
    } catch {
        Write-Host "  Status: ERROR" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

# Test 6: Create payment plan
if ($global:testCaseId) {
    Write-Host "[Test 6] POST /api/arrears/:id/payment-plan - Create payment plan" -ForegroundColor Yellow
    try {
        $startDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
        $body = @{
            installmentAmount = 50.00
            numberOfInstallments = 5
            startDate = $startDate
            frequency = "monthly"
            notes = "5 monthly payments of `$50"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears/$global:testCaseId/payment-plan" -Method Post -Headers $headers -Body $body
        
        if ($response.success) {
            Write-Host "  Status: SUCCESS" -ForegroundColor Green
            Write-Host "  Payment Plan Created: $($response.data.paymentSchedule.Count) installments"
            Write-Host "  First Payment: $(([DateTime]$response.data.paymentSchedule[0].dueDate).ToString('yyyy-MM-dd'))"
            Write-Host "  Installment Amount: `$$($response.data.paymentSchedule[0].amount)"
        } else {
            Write-Host "  Status: FAILED" -ForegroundColor Red
            Write-Host "  Error: $($response.error)"
        }
    } catch {
        Write-Host "  Status: ERROR" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

# Test 7: Log contact with member
if ($global:testCaseId) {
    Write-Host "[Test 7] POST /api/arrears/:id/contact - Log contact attempt" -ForegroundColor Yellow
    try {
        $body = @{
            contactType = "phone"
            notes = "Called member, discussed payment options"
            outcome = "Agreed to payment plan"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears/$global:testCaseId/contact" -Method Post -Headers $headers -Body $body
        
        if ($response.success) {
            Write-Host "  Status: SUCCESS" -ForegroundColor Green
            Write-Host "  Contact Logged: $($response.data.lastContactDate)"
        } else {
            Write-Host "  Status: FAILED" -ForegroundColor Red
            Write-Host "  Error: $($response.error)"
        }
    } catch {
        Write-Host "  Status: ERROR" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

# Test 8: Record payment
if ($global:testCaseId) {
    Write-Host "[Test 8] POST /api/arrears/:id/payment - Record payment" -ForegroundColor Yellow
    try {
        $body = @{
            amount = 50.00
            paymentMethod = "bank_transfer"
            notes = "First installment payment received"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/api/arrears/$global:testCaseId/payment" -Method Post -Headers $headers -Body $body
        
        if ($response.success) {
            Write-Host "  Status: SUCCESS" -ForegroundColor Green
            Write-Host "  Payment Amount: `$$($response.data.payment.amount)"
            Write-Host "  Previous Balance: `$$($response.data.payment.previousBalance)"
            Write-Host "  New Balance: `$$($response.data.payment.newBalance)"
        } else {
            Write-Host "  Status: FAILED" -ForegroundColor Red
            Write-Host "  Error: $($response.error)"
        }
    } catch {
        Write-Host "  Status: ERROR" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
