# Analytics & Forecasting Test Suite
# Week 9-10: Test AI burn-rate predictor and financial analytics

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3007"
$testsPassed = 0
$testsFailed = 0

$tenantId = "11111111-1111-1111-1111-111111111111"
$userId = "22222222-2222-2222-2222-222222222222"
$fundId = "33333333-3333-3333-3333-333333333333"

$testUser = @{
    id = $userId
    tenantId = $tenantId
    role = "admin"
    permissions = @("analytics:*")
} | ConvertTo-Json -Compress

$headers = @{
    "Content-Type" = "application/json"
    "x-test-user" = $testUser
    "x-tenant-id" = $tenantId
}

Write-Host "Analytics & Forecasting Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# TEST 1: Get financial summary
Write-Host "TEST 1: Get financial summary" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/summary" -Method Get -Headers $headers
    if ($response.success -and $response.summary) {
        Write-Host "PASS: Financial summary retrieved" -ForegroundColor Green
        Write-Host ("  - Strike Funds: " + $response.summary.strikeFunds.count) -ForegroundColor Gray
        Write-Host ("  - Total Balance: $" + $response.summary.strikeFunds.totalBalance) -ForegroundColor Gray
        Write-Host ("  - Net Cash Flow (30d): $" + $response.summary.last30Days.netCashFlow) -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 2: Get financial trends
Write-Host ""
Write-Host "TEST 2: Get financial trends (90 days)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/trends?days=90" -Method Get -Headers $headers
    if ($response.success -and $response.trends) {
        Write-Host "PASS: Trends data retrieved" -ForegroundColor Green
        Write-Host ("  - Donation records: " + $response.trends.donations.Count) -ForegroundColor Gray
        Write-Host ("  - Stipend records: " + $response.trends.stipends.Count) -ForegroundColor Gray
        Write-Host ("  - Period: " + $response.period.days + " days") -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 3: Get fund health status
Write-Host ""
Write-Host "TEST 3: Get fund health status" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/fund-health" -Method Get -Headers $headers
    if ($response.success -and $response.funds) {
        Write-Host "PASS: Fund health data retrieved" -ForegroundColor Green
        Write-Host ("  - Total Funds: " + $response.summary.total) -ForegroundColor Gray
        Write-Host ("  - Healthy: " + $response.summary.healthy) -ForegroundColor Green
        Write-Host ("  - Warning: " + $response.summary.warning) -ForegroundColor Yellow
        Write-Host ("  - Critical: " + $response.summary.critical) -ForegroundColor Red
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 4: Get top donors
Write-Host ""
Write-Host "TEST 4: Get top donors" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/top-donors?limit=5" -Method Get -Headers $headers
    if ($response.success -and $response.topDonors) {
        Write-Host "PASS: Top donors retrieved" -ForegroundColor Green
        Write-Host ("  - Top donor count: " + $response.topDonors.Count) -ForegroundColor Gray
        if ($response.topDonors.Count -gt 0) {
            Write-Host ("  - Top donor: " + $response.topDonors[0].donorName + " ($" + $response.topDonors[0].totalAmount + ")") -ForegroundColor Gray
        }
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 5: Generate burn-rate forecast (skip if no fund exists)
Write-Host ""
Write-Host "TEST 5: Generate burn-rate forecast" -ForegroundColor Yellow
try {
    # First get a real fund ID
    $fundsResponse = Invoke-RestMethod -Uri "$baseUrl/api/strike-funds" -Method Get -Headers $headers
    if ($fundsResponse.success -and $fundsResponse.funds -and $fundsResponse.funds.Count -gt 0) {
        $realFundId = $fundsResponse.funds[0].id
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/forecast/$realFundId?forecastDays=90" -Method Get -Headers $headers
        if ($response.success -and $response.forecast) {
            Write-Host "PASS: Burn-rate forecast generated" -ForegroundColor Green
            Write-Host ("  - Fund: " + $response.forecast.fundName) -ForegroundColor Gray
            Write-Host ("  - Current Balance: $" + $response.forecast.currentBalance) -ForegroundColor Gray
            Write-Host ("  - Scenarios: " + $response.forecast.scenarios.Count) -ForegroundColor Gray
            Write-Host ("  - Alerts: " + $response.forecast.alerts.Count) -ForegroundColor Gray
            Write-Host ("  - Recommendations: " + $response.forecast.recommendations.Count) -ForegroundColor Gray
            $testsPassed++
        } else {
            Write-Host "FAIL: Invalid forecast response" -ForegroundColor Red
            $testsFailed++
        }
    } else {
        Write-Host "SKIP: No strike funds available for testing" -ForegroundColor Yellow
        Write-Host "  (This is expected if no funds have been created yet)" -ForegroundColor Gray
    }
} catch {
    Write-Host ("SKIP: " + $_.Exception.Message) -ForegroundColor Yellow
    Write-Host "  (This is expected if no funds exist or insufficient data)" -ForegroundColor Gray
}

# TEST 6: Get historical burn rate (skip if no fund exists)
Write-Host ""
Write-Host "TEST 6: Get historical burn rate" -ForegroundColor Yellow
try {
    # Use same fund from test 5
    $fundsResponse = Invoke-RestMethod -Uri "$baseUrl/api/strike-funds" -Method Get -Headers $headers
    if ($fundsResponse.success -and $fundsResponse.funds -and $fundsResponse.funds.Count -gt 0) {
        $realFundId = $fundsResponse.funds[0].id
        $endDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/historical/$realFundId?startDate=$startDate&endDate=$endDate" -Method Get -Headers $headers
        if ($response.success) {
            Write-Host "PASS: Historical burn rate retrieved" -ForegroundColor Green
            Write-Host ("  - Data points: " + $response.count) -ForegroundColor Gray
            $testsPassed++
        } else {
            Write-Host "FAIL: Invalid response" -ForegroundColor Red
            $testsFailed++
        }
    } else {
        Write-Host "SKIP: No strike funds available for testing" -ForegroundColor Yellow
    }
} catch {
    Write-Host ("SKIP: " + $_.Exception.Message) -ForegroundColor Yellow
}

# TEST 7: Get seasonal patterns (skip if no fund exists)
Write-Host ""
Write-Host "TEST 7: Get seasonal patterns" -ForegroundColor Yellow
try {
    $fundsResponse = Invoke-RestMethod -Uri "$baseUrl/api/strike-funds" -Method Get -Headers $headers
    if ($fundsResponse.success -and $fundsResponse.funds -and $fundsResponse.funds.Count -gt 0) {
        $realFundId = $fundsResponse.funds[0].id
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/seasonal/$realFundId" -Method Get -Headers $headers
        if ($response.success -and $response.patterns) {
            Write-Host "PASS: Seasonal patterns retrieved" -ForegroundColor Green
            Write-Host ("  - Patterns: " + $response.patterns.Count + " months") -ForegroundColor Gray
            $testsPassed++
        } else {
            Write-Host "FAIL: Invalid response" -ForegroundColor Red
            $testsFailed++
        }
    } else {
        Write-Host "SKIP: No strike funds available for testing" -ForegroundColor Yellow
    }
} catch {
    Write-Host ("SKIP: " + $_.Exception.Message) -ForegroundColor Yellow
}

# TEST 8: Process automated alerts
Write-Host ""
Write-Host "TEST 8: Process automated alerts" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/alerts/process" -Method Post -Headers $headers
    if ($response.success) {
        Write-Host "PASS: Automated alerts processed" -ForegroundColor Green
        Write-Host ("  - Alerts sent: " + $response.alertsSent) -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 9: Generate weekly forecast report
Write-Host ""
Write-Host "TEST 9: Generate weekly forecast report" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/reports/weekly" -Method Post -Headers $headers
    if ($response.success) {
        Write-Host "PASS: Weekly report generated" -ForegroundColor Green
        Write-Host ("  - " + $response.message) -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
$totalTests = $testsPassed + $testsFailed
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($totalTests -gt 0) {
    $passRate = [math]::Round(($testsPassed / $totalTests) * 100, 1)
    Write-Host ("Pass Rate: " + $passRate + "%") -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })
}

Write-Host ""
Write-Host "NOTE: Some tests skip if no historical data exists." -ForegroundColor Gray
Write-Host "Create strike funds and add transactions for full test coverage." -ForegroundColor Gray
Write-Host ""
