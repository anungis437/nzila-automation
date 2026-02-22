# Financial Reports Testing Suite
# Tests all financial reporting endpoints with various scenarios

$baseUrl = "http://localhost:3007"

# Test user configuration
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
Write-Host "Financial Reports Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get Financial Dashboard (last 30 days)
Write-Host "[Test 1] GET /api/reports/dashboard - Last 30 days" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/dashboard" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Collection Rate: $($response.data.collectionMetrics.collectionRate)%" -ForegroundColor White
    Write-Host "  Total Revenue: `$$($response.data.revenueAnalysis.totalRevenue)" -ForegroundColor White
    Write-Host "  Arrears Cases: $($response.data.arrearsStats.totalCases)" -ForegroundColor White
    Write-Host "  Top Payers: $($response.data.topPayers.Count)" -ForegroundColor White
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Get Financial Dashboard (custom date range - Q4 2024)
Write-Host "[Test 2] GET /api/reports/dashboard - Q4 2024" -ForegroundColor Yellow
try {
    $params = @{
        startDate = "2024-10-01"
        endDate = "2024-12-31"
    }
    $queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/dashboard?$queryString" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Date Range: $($params.startDate) to $($params.endDate)" -ForegroundColor White
    Write-Host "  Total Dues Charged: `$$($response.data.collectionMetrics.totalDuesCharged)" -ForegroundColor White
    Write-Host "  Total Collected: `$$($response.data.collectionMetrics.totalCollected)" -ForegroundColor White
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Collection Metrics (last quarter)
Write-Host "[Test 3] GET /api/reports/collection-metrics - Last quarter" -ForegroundColor Yellow
try {
    $endDate = Get-Date -Format "yyyy-MM-dd"
    $startDate = (Get-Date).AddDays(-90).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/collection-metrics?startDate=$startDate&endDate=$endDate" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Total Dues Charged: `$$($response.data.totalDuesCharged)" -ForegroundColor White
    Write-Host "  Total Collected: `$$($response.data.totalCollected)" -ForegroundColor White
    Write-Host "  Collection Rate: $($response.data.collectionRate)%" -ForegroundColor White
    Write-Host "  Outstanding: `$$($response.data.outstandingAmount)" -ForegroundColor White
    Write-Host "  Payment Rate: $($response.data.paymentRate)%" -ForegroundColor White
    Write-Host "  Avg Payment Time: $($response.data.averagePaymentTime) days" -ForegroundColor White
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Arrears Statistics
Write-Host "[Test 4] GET /api/reports/arrears-statistics" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/arrears-statistics" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Total Cases: $($response.data.totalCases)" -ForegroundColor White
    Write-Host "  Total Owed: `$$($response.data.totalOwed)" -ForegroundColor White
    Write-Host "  Average Days Overdue: $($response.data.averageDaysOverdue)" -ForegroundColor White
    if ($response.data.casesByStatus) {
        Write-Host "  Cases by Status:" -ForegroundColor White
        $response.data.casesByStatus.PSObject.Properties | ForEach-Object {
            Write-Host "    $($_.Name): $($_.Value)" -ForegroundColor Gray
        }
    }
    if ($response.data.oldestCase) {
        Write-Host "  Oldest Case: $($response.data.oldestCase.daysOverdue) days overdue" -ForegroundColor White
    }
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Revenue Analysis (last 6 months)
Write-Host "[Test 5] GET /api/reports/revenue-analysis - Last 6 months" -ForegroundColor Yellow
try {
    $endDate = Get-Date -Format "yyyy-MM-dd"
    $startDate = (Get-Date).AddMonths(-6).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/revenue-analysis?startDate=$startDate&endDate=$endDate" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Total Revenue: `$$($response.data.totalRevenue)" -ForegroundColor White
    Write-Host "  Growth Rate: $($response.data.growthRate)%" -ForegroundColor White
    Write-Host "  Monthly Revenue:" -ForegroundColor White
    $response.data.revenueByMonth | ForEach-Object {
        Write-Host "    $($_.month): `$$($_.amount) ($($_.transactionCount) transactions)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Member Payment Patterns (top 20)
Write-Host "[Test 6] GET /api/reports/member-payment-patterns - Top 20 payers" -ForegroundColor Yellow
try {
    $endDate = Get-Date -Format "yyyy-MM-dd"
    $startDate = (Get-Date).AddDays(-90).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/member-payment-patterns?startDate=$startDate&endDate=$endDate&limit=20" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Total Patterns: $($response.data.count)" -ForegroundColor White
    if ($response.data.patterns.Count -gt 0) {
        Write-Host "  Top 5 Most Reliable Payers:" -ForegroundColor White
        $response.data.patterns | Select-Object -First 5 | ForEach-Object {
            Write-Host "    Member: $($_.memberId.Substring(0,8))..." -ForegroundColor Gray
            Write-Host "      Total Paid: `$$($_.totalPaid)" -ForegroundColor Gray
            Write-Host "      Reliability Score: $($_.paymentReliabilityScore)/100" -ForegroundColor Gray
            Write-Host "      On-Time: $($_.onTimePayments), Late: $($_.latePayments), Missed: $($_.missedPayments)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Export Dashboard Report (JSON)
Write-Host "[Test 7] GET /api/reports/export - Dashboard JSON export" -ForegroundColor Yellow
try {
    $endDate = Get-Date -Format "yyyy-MM-dd"
    $startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/export?type=dashboard&startDate=$startDate&endDate=$endDate&format=json" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Report Type: $($response.reportType)" -ForegroundColor White
    Write-Host "  Exported At: $($response.exportedAt)" -ForegroundColor White
    Write-Host "  Data Keys: $($response.data.PSObject.Properties.Name -join ', ')" -ForegroundColor White
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Export Collection Metrics (CSV format)
Write-Host "[Test 8] GET /api/reports/export - Collection Metrics CSV" -ForegroundColor Yellow
try {
    $endDate = Get-Date -Format "yyyy-MM-dd"
    $startDate = (Get-Date).AddDays(-90).ToString("yyyy-MM-dd")
    $response = Invoke-WebRequest -Uri "$baseUrl/api/reports/export?type=collection&startDate=$startDate&endDate=$endDate&format=csv" -Method GET -Headers $headers
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor White
    Write-Host "  Content-Disposition: $($response.Headers.'Content-Disposition')" -ForegroundColor White
    $csvLines = $response.Content -split "`n"
    Write-Host "  CSV Lines: $($csvLines.Count)" -ForegroundColor White
    Write-Host "  Preview (first 5 lines):" -ForegroundColor White
    $csvLines | Select-Object -First 5 | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: Invalid Date Range (should fail validation)
Write-Host "[Test 9] GET /api/reports/collection-metrics - Invalid date range" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/collection-metrics?startDate=invalid&endDate=2024-12-31" -Method GET -Headers $headers
    Write-Host "  Status: UNEXPECTED SUCCESS" -ForegroundColor Red
} catch {
    Write-Host "  Status: EXPECTED ERROR (validation)" -ForegroundColor Green
    Write-Host "  Error Message: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# Test 10: Unauthorized Access (no auth header)
Write-Host "[Test 10] GET /api/reports/dashboard - No authentication" -ForegroundColor Yellow
try {
    $noAuthHeaders = @{
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports/dashboard" -Method GET -Headers $noAuthHeaders
    Write-Host "  Status: UNEXPECTED SUCCESS" -ForegroundColor Red
} catch {
    Write-Host "  Status: EXPECTED ERROR (401 Unauthorized)" -ForegroundColor Green
    Write-Host "  Error Message: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
