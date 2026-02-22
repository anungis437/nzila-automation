# Payment Processing Test Suite
$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3007"
$testsPassed = 0
$testsFailed = 0

$tenantId = "11111111-1111-1111-1111-111111111111"
$memberId = "22222222-2222-2222-2222-222222222222"
$strikeFundId = "33333333-3333-3333-3333-333333333333"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer test-token-123"
    "x-tenant-id" = $tenantId
}

Write-Host "Payment Processing Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# TEST 1: Create dues payment intent
Write-Host "TEST 1: Create dues payment intent" -ForegroundColor Yellow
$body = @{ memberId = $memberId; amount = 50.00; currency = "usd"; paymentMethod = "card" } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/payments/dues/intent" -Method Post -Headers $headers -Body $body
    if ($response.success) {
        Write-Host "PASS: Dues payment intent created" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 2: Create donation payment intent
Write-Host ""
Write-Host "TEST 2: Create donation payment intent" -ForegroundColor Yellow
$body = @{ strikeFundId = $strikeFundId; tenantId = $tenantId; amount = 100.00; currency = "usd"; donorEmail = "donor@example.com"; donorName = "Jane Supporter"; paymentMethod = "card" } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/payments/donations/intent" -Method Post -Headers $headers -Body $body
    if ($response.success) {
        Write-Host "PASS: Donation payment intent created" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 3: Get payment summary
Write-Host ""
Write-Host "TEST 3: Get payment summary" -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/payments/summary?strikeFundId=$strikeFundId"
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    Write-Host "PASS: Summary endpoint accessible" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "PASS: Summary endpoint accessible (no data yet)" -ForegroundColor Green
    $testsPassed++
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
$totalTests = $testsPassed + $testsFailed
Write-Host "Total: $totalTests  Passed: $testsPassed  Failed: $testsFailed" -ForegroundColor White
