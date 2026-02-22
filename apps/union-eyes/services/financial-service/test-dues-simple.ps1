# Simple Dues Calculation Test Script
# Tests all calculation types using the Financial Service API

$baseUrl = "http://localhost:3007"

# Test authentication header for development
$testUser = '{"id":"test-user","tenantId":"a1111111-1111-1111-1111-111111111111","role":"admin","permissions":["*"]}'
$headers = @{"X-Test-User" = $testUser}

# Test member IDs from seed data (actual member IDs from database)
$member1 = "c1111111-1111-1111-1111-111111111111"
$member2 = "c2222222-2222-2222-2222-222222222222"
$member3 = "c3333333-3333-3333-3333-333333333333"

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Dues Calculation Testing Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Flat Rate Calculation (MONTHLY_STANDARD rule - $45)
Write-Host "[Test 1] Flat Rate Calculation ($45 monthly)" -ForegroundColor Green

$body1 = @{
    memberId = $member1
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    grossWages = 3000.00
} | ConvertTo-Json

try {
    $result1 = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/calculate" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $body1
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Base Dues: $($result1.data.calculation.baseDuesAmount)" -ForegroundColor White
    Write-Host "  Total Amount: $($result1.data.calculation.totalAmount)" -ForegroundColor White
    Write-Host "  Rule: $($result1.data.rule.name)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 2: Percentage Calculation (2% of wages)
Write-Host "[Test 2] Percentage Calculation (2% of wages)" -ForegroundColor Green

$body2 = @{
    memberId = $member2
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    grossWages = 5000.00
} | ConvertTo-Json

try {
    $result2 = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/calculate" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $body2
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Base Dues: $($result2.data.calculation.baseDuesAmount)" -ForegroundColor White
    Write-Host "  Total Amount: $($result2.data.calculation.totalAmount)" -ForegroundColor White
    Write-Host "  Rule: $($result2.data.rule.name)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 3: Hourly Calculation
Write-Host "[Test 3] Hourly Calculation ($0.50 per hour)" -ForegroundColor Green

$body3 = @{
    memberId = $member3
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    hoursWorked = 160
    hourlyRate = 25.00
} | ConvertTo-Json

try {
    $result3 = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/calculate" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $body3
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Base Dues: $($result3.data.calculation.baseDuesAmount)" -ForegroundColor White
    Write-Host "  Total Amount: $($result3.data.calculation.totalAmount)" -ForegroundColor White
    Write-Host "  Rule: $($result3.data.rule.name)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 4: Batch Calculation
Write-Host "[Test 4] Batch Calculation (3 members)" -ForegroundColor Green

$batchBody = @{
    memberIds = @($member1, $member2, $member3)
    memberData = @(
        @{
            memberId = $member1
            grossWages = 0
            baseSalary = 0
            hourlyRate = 0
            hoursWorked = 0
        },
        @{
            memberId = $member2
            grossWages = 5000
            baseSalary = 0
            hourlyRate = 0
            hoursWorked = 0
        },
        @{
            memberId = $member3
            grossWages = 0
            baseSalary = 0
            hourlyRate = 25
            hoursWorked = 160
        }
    )
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    dryRun = $true
} | ConvertTo-Json -Depth 5

try {
    $batchResult = Invoke-RestMethod -Uri "$baseUrl/api/dues/transactions/batch" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $batchBody
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Total Processed: $($batchResult.data.totalProcessed)" -ForegroundColor White
    Write-Host "  Successful: $($batchResult.data.successful)" -ForegroundColor White
    Write-Host "  Failed: $($batchResult.data.failed)" -ForegroundColor White
    Write-Host "  Total Revenue: `$$($batchResult.data.summary.totalRevenue)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
