#!/usr/bin/env pwsh
# Test Dues Calculation Engine and API
# Tests all calculation types: percentage, flat rate, hourly, tiered

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Dues Calculation Engine Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3007"
$tenant = "a1111111-1111-1111-1111-111111111111"
$fundId = "b7e92b69-3145-4a9b-822b-ed2e0ab9247c"

# Test user header for development bypass
$testUser = @{
    id = "test-admin-123"
    tenantId = $tenant
    role = "admin"
    permissions = @("dues:read", "dues:write", "dues:calculate")
} | ConvertTo-Json -Compress

$headers = @{
    "X-Test-User" = $testUser
    "Content-Type" = "application/json"
}

# Test member IDs (from seed data)
$member1 = "11111111-1111-1111-1111-111111111111"
$member2 = "22222222-2222-2222-2222-222222222222"
$member3 = "33333333-3333-3333-3333-333333333333"

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  Service URL: $baseUrl" -ForegroundColor White
Write-Host "  Tenant ID: $tenant" -ForegroundColor White
Write-Host "  Test Members: $member1, $member2, $member3" -ForegroundColor White
Write-Host ""

# ============================================================================
# Test 1: Get Dues Rules
# ============================================================================

Write-Host "[Test 1] Fetching Dues Rules..." -ForegroundColor Green

try {
    $rules = Invoke-RestMethod -Uri "$baseUrl/api/dues/rules" -Method GET -Headers $headers
    
    if ($rules.success) {
        Write-Host "  ✓ Found $($rules.data.Count) dues rules" -ForegroundColor Green
        foreach ($rule in $rules.data) {
            Write-Host "    - $($rule.name) ($($rule.code)): $($rule.calculationType)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ Failed to fetch rules: $($rules.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Test 2: Get Member Assignments
# ============================================================================

Write-Host "[Test 2] Fetching Member Assignments..." -ForegroundColor Green

try {
    $assignments = Invoke-RestMethod -Uri "$baseUrl/api/dues/assignments" -Method GET -Headers $headers
    
    if ($assignments.success) {
        Write-Host "  ✓ Found $($assignments.data.Count) assignments" -ForegroundColor Green
        foreach ($assignment in $assignments.data) {
            Write-Host "    - Member $($assignment.memberId): Rule $($assignment.duesRuleId)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ Failed to fetch assignments: $($assignments.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Test 3: Calculate Dues - Flat Rate ($45/month)
# ============================================================================

Write-Host "[Test 3] Testing Flat Rate Calculation..." -ForegroundColor Green

$flatRateBody = @{
    memberId = $member1
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/calculate" -Method POST -Headers $headers -Body $flatRateBody
    
    if ($result.success) {
        $calc = $result.data.calculation
        Write-Host "  ✓ Calculation successful" -ForegroundColor Green
        Write-Host "    Calculation Type: $($calc.calculationMethod)" -ForegroundColor Gray
        Write-Host "    Base Dues: `$$($calc.baseDuesAmount)" -ForegroundColor White
        Write-Host "    COPE: `$$($calc.copeAmount)" -ForegroundColor Gray
        Write-Host "    PAC: `$$($calc.pacAmount)" -ForegroundColor Gray
        Write-Host "    Strike Fund: `$$($calc.strikeFundAmount)" -ForegroundColor Gray
        Write-Host "    Late Fee: `$$($calc.lateFeeAmount)" -ForegroundColor Gray
        Write-Host "    Total: `$$($calc.totalAmount)" -ForegroundColor Cyan
        
        if ($calc.calculationSteps) {
            Write-Host "    Steps:" -ForegroundColor Gray
            foreach ($step in $calc.calculationSteps) {
                Write-Host "      - $step" -ForegroundColor DarkGray
            }
        }
    } else {
        Write-Host "  ✗ Calculation failed: $($result.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
    Write-Host "  Response: $($_.Exception.Response)" -ForegroundColor DarkRed
}

Write-Host ""

# ============================================================================
# Test 4: Calculate Dues - Percentage (2% of gross wages)
# ============================================================================

Write-Host "[Test 4] Testing Percentage-Based Calculation..." -ForegroundColor Green

$percentageBody = @{
    memberId = $member2
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    grossWages = 4000.00
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/calculate" -Method POST -Headers $headers -Body $percentageBody
    
    if ($result.success) {
        $calc = $result.data.calculation
        Write-Host "  ✓ Calculation successful" -ForegroundColor Green
        Write-Host "    Gross Wages: `$4,000.00" -ForegroundColor Gray
        Write-Host "    Rate: 2%" -ForegroundColor Gray
        Write-Host "    Base Dues: `$$($calc.baseDuesAmount)" -ForegroundColor White
        Write-Host "    Total: `$$($calc.totalAmount)" -ForegroundColor Cyan
    } else {
        Write-Host "  ✗ Calculation failed: $($result.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Test 5: Calculate Dues - Hourly ($0.50/hour)
# ============================================================================

Write-Host "[Test 5] Testing Hourly-Based Calculation..." -ForegroundColor Green

$hourlyBody = @{
    memberId = $member3
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    hoursWorked = 160.0
    hourlyRate = 25.00
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/calculate" -Method POST -Headers $headers -Body $hourlyBody
    
    if ($result.success) {
        $calc = $result.data.calculation
        Write-Host "  ✓ Calculation successful" -ForegroundColor Green
        Write-Host "    Hours Worked: 160" -ForegroundColor Gray
        Write-Host "    Rate per Hour: `$0.50" -ForegroundColor Gray
        Write-Host "    Base Dues: `$$($calc.baseDuesAmount)" -ForegroundColor White
        Write-Host "    Total: `$$($calc.totalAmount)" -ForegroundColor Cyan
    } else {
        Write-Host "  ✗ Calculation failed: $($result.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Test 6: Batch Calculation (Dry Run)
# ============================================================================

Write-Host "[Test 6] Testing Batch Calculation (Dry Run)..." -ForegroundColor Green

$batchBody = @{
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    dryRun = $true
    memberIds = @($member1, $member2, $member3)
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/batch" -Method POST -Headers $headers -Body $batchBody
    
    if ($result.success) {
        $summary = $result.data.summary
        Write-Host "  ✓ Batch calculation successful" -ForegroundColor Green
        Write-Host "    Total Processed: $($summary.totalProcessed)" -ForegroundColor Gray
        Write-Host "    Successful: $($summary.successCount)" -ForegroundColor Green
        Write-Host "    Failed: $($summary.errorCount)" -ForegroundColor $(if ($summary.errorCount -gt 0) { "Red" } else { "Gray" })
        Write-Host "    Total Revenue: `$$($summary.totalRevenue)" -ForegroundColor Cyan
        
        if ($result.data.transactions -and $result.data.transactions.Count -gt 0) {
            Write-Host "    Transactions:" -ForegroundColor Gray
            foreach ($tx in $result.data.transactions) {
                Write-Host "      - Member $($tx.memberId): `$$($tx.totalAmount)" -ForegroundColor DarkGray
            }
        }
        
        if ($result.data.errors -and $result.data.errors.Count -gt 0) {
            Write-Host "    Errors:" -ForegroundColor Red
            foreach ($err in $result.data.errors) {
                Write-Host "      - Member $($err.memberId): $($err.error)" -ForegroundColor DarkRed
            }
        }
    } else {
        Write-Host "  ✗ Batch calculation failed: $($result.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response Body: $responseBody" -ForegroundColor DarkRed
    }
}

Write-Host ""

# ============================================================================
# Test 7: Query Existing Transactions
# ============================================================================

Write-Host "[Test 7] Querying Existing Transactions..." -ForegroundColor Green

try {
    $transactions = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions" -Method GET -Headers $headers
    
    if ($transactions.success) {
        Write-Host "  ✓ Found $($transactions.data.Count) transactions" -ForegroundColor Green
        
        if ($transactions.data.Count -gt 0) {
            Write-Host "    Recent Transactions:" -ForegroundColor Gray
            $transactions.data | Select-Object -First 5 | ForEach-Object {
                Write-Host "      - $($_.createdAt): Member $($_.memberId) - `$$($_.totalAmount) ($($_.status))" -ForegroundColor DarkGray
            }
        }
    } else {
        Write-Host "  ✗ Failed to fetch transactions: $($transactions.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Summary
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Suite Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review calculation accuracy" -ForegroundColor White
Write-Host "  2. Test batch processing (without dryRun)" -ForegroundColor White
Write-Host "  3. Test remittance processing" -ForegroundColor White
Write-Host "  4. Build admin dashboard" -ForegroundColor White
Write-Host ""
