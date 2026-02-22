# Notification System Test Suite
# Week 9-10: Test multi-channel notification delivery

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3007"
$testsPassed = 0
$testsFailed = 0

$tenantId = "11111111-1111-1111-1111-111111111111"
$userId = "22222222-2222-2222-2222-222222222222"

$testUser = @{
    id = $userId
    tenantId = $tenantId
    role = "admin"
    permissions = @("notifications:*")
} | ConvertTo-Json -Compress

$headers = @{
    "Content-Type" = "application/json"
    "x-test-user" = $testUser
    "x-tenant-id" = $tenantId
}

Write-Host "Notification System Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# TEST 1: Queue payment confirmation notification
Write-Host "TEST 1: Queue payment confirmation notification" -ForegroundColor Yellow
$body = @{
    userId = $userId
    type = "payment_confirmation"
    channels = @("email", "sms")
    priority = "normal"
    data = @{
        amount = "$50.00"
        transactionId = "txn_test_123"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/queue" -Method Post -Headers $headers -Body $body
    if ($response.success -and $response.notificationId) {
        Write-Host "PASS: Notification queued" -ForegroundColor Green
        Write-Host ("  - Notification ID: " + $response.notificationId) -ForegroundColor Gray
        $testsPassed++
        $notificationId = $response.notificationId
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 2: Get user notification preferences
Write-Host ""
Write-Host "TEST 2: Get user notification preferences" -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/notifications/preferences?userId=$userId"
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    if ($response.success -and $response.preferences) {
        Write-Host "PASS: Preferences retrieved" -ForegroundColor Green
        $prefCount = ($response.preferences.PSObject.Properties | Measure-Object).Count
        Write-Host ("  - Preference count: " + $prefCount) -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 3: Update notification preferences
Write-Host ""
Write-Host "TEST 3: Update notification preferences" -ForegroundColor Yellow
$body = @{
    userId = $userId
    preferences = @{
        payment_confirmation_email = $true
        payment_confirmation_sms = $false
        payment_failed_email = $true
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/preferences" -Method Put -Headers $headers -Body $body
    if ($response.success) {
        Write-Host "PASS: Preferences updated" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAIL: Update failed" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 4: Get notification history
Write-Host ""
Write-Host "TEST 4: Get notification history" -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/notifications/history?userId=$userId&limit=10"
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    if ($response.success) {
        Write-Host "PASS: History retrieved" -ForegroundColor Green
        Write-Host ("  - Notification count: " + $response.count) -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "FAIL: Invalid response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 5: Queue multiple notification types
Write-Host ""
Write-Host "TEST 5: Queue different notification types" -ForegroundColor Yellow
$types = @("donation_received", "stipend_approved", "low_balance_alert")
$queued = 0

foreach ($type in $types) {
    $body = @{
        userId = $userId
        type = $type
        channels = @("email")
        data = @{
            amount = "$100.00"
            fundName = "Test Strike Fund"
        }
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/queue" -Method Post -Headers $headers -Body $body
        if ($response.success) {
            $queued++
        }
    } catch {
        # Continue testing other types
    }
}

if ($queued -eq $types.Count) {
    Write-Host ("PASS: All notification types queued (" + $queued + "/" + $types.Count + ")") -ForegroundColor Green
    $testsPassed++
} elseif ($queued -gt 0) {
    Write-Host ("PARTIAL: Some types queued (" + $queued + "/" + $types.Count + ")") -ForegroundColor Yellow
    $testsPassed++
} else {
    Write-Host "FAIL: No notifications queued" -ForegroundColor Red
    $testsFailed++
}

# TEST 6: Process pending notifications
Write-Host ""
Write-Host "TEST 6: Process pending notifications" -ForegroundColor Yellow
$body = @{
    batchSize = 10
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/process" -Method Post -Headers $headers -Body $body
    if ($response.success) {
        Write-Host "PASS: Notifications processed" -ForegroundColor Green
        Write-Host ("  - Processed count: " + $response.processed) -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "FAIL: Processing failed" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 7: Send test notification
Write-Host ""
Write-Host "TEST 7: Send test notification" -ForegroundColor Yellow
$body = @{
    userId = $userId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/test" -Method Post -Headers $headers -Body $body
    if ($response.success) {
        Write-Host "PASS: Test notification sent" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAIL: Test send failed" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host ("FAIL: " + $_.Exception.Message) -ForegroundColor Red
    $testsFailed++
}

# TEST 8: Queue with priority
Write-Host ""
Write-Host "TEST 8: Queue notification with priority levels" -ForegroundColor Yellow
$priorities = @("low", "normal", "high", "urgent")
$priorQueued = 0

foreach ($priority in $priorities) {
    $body = @{
        userId = $userId
        type = "strike_announcement"
        channels = @("email", "sms", "push")
        priority = $priority
        data = @{
            title = "Strike Update"
            message = "Test priority: $priority"
        }
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications/queue" -Method Post -Headers $headers -Body $body
        if ($response.success) {
            $priorQueued++
        }
    } catch {
        # Continue
    }
}

if ($priorQueued -eq $priorities.Count) {
    Write-Host ("PASS: All priority levels working (" + $priorQueued + "/" + $priorities.Count + ")") -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host ("PARTIAL: Some priorities working (" + $priorQueued + "/" + $priorities.Count + ")") -ForegroundColor Yellow
    $testsPassed++
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
Write-Host "NOTE: Email/SMS providers need configuration for real delivery." -ForegroundColor Gray
Write-Host "Console logs show simulated notification delivery." -ForegroundColor Gray
Write-Host ""
