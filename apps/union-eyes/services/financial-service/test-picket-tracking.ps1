# Week 5: Picket Tracking System - Test Suite
# Tests NFC/QR code check-ins, GPS verification, and attendance tracking

Write-Host "`n=== PICKET TRACKING SYSTEM TESTS ===" -ForegroundColor Cyan
Write-Host "Starting tests...`n"

$baseUrl = "http://localhost:3007"
$testResults = @()

# Test authentication header
$testUser = @{
    id = "test-user-123"
    tenantId = "11111111-1111-1111-1111-111111111111"
    role = "admin"
    permissions = @("picket:manage", "members:view")
} | ConvertTo-Json -Compress

$headers = @{
    "Content-Type" = "application/json"
    "X-Test-User" = $testUser
}

# Test data
$strikeFundId = "22222222-2222-2222-2222-222222222222"
$member1Id = "33333333-3333-3333-3333-333333333333"
$member2Id = "44444444-4444-4444-4444-444444444444"
$picketLocation = @{
    latitude = 40.7128
    longitude = -74.0060
    radius = 100
}

# Helper functions
function Write-Success { param($message) Write-Host $message -ForegroundColor Green }
function Write-Failure { param($message) Write-Host $message -ForegroundColor Red }
function Write-Info { param($message) Write-Host $message -ForegroundColor Yellow }

# ==============================================================================
# TEST 1: Generate QR Code
# ==============================================================================
Write-Info "[Test 1] POST /api/picket/generate-qr - Generate QR code for member"
try {
    $body = @{
        strikeFundId = $strikeFundId
        memberId = $member1Id
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/generate-qr" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.success -and $response.data.qrData) {
        $global:qrCode = $response.data.qrData
        Write-Success "  Status: SUCCESS"
        Write-Host "  QR Code: $($response.data.qrData.Substring(0,50))..."
        Write-Host "  Expires In: $($response.data.expiresIn)"
        $testResults += [PSCustomObject]@{Test="Generate QR Code"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED - No QR data returned"
        $testResults += [PSCustomObject]@{Test="Generate QR Code"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="Generate QR Code"; Status="FAIL"}
}

# ==============================================================================
# TEST 2: Validate QR Code
# ==============================================================================
Write-Info "`n[Test 2] POST /api/picket/validate-qr - Validate generated QR code"
try {
    $body = @{
        qrData = $global:qrCode
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/validate-qr" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.success) {
        Write-Success "  Status: SUCCESS"
        Write-Host "  Fund ID: $($response.data.fundId)"
        Write-Host "  Member ID: $($response.data.memberId)"
        $testResults += [PSCustomObject]@{Test="Validate QR Code"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED"
        $testResults += [PSCustomObject]@{Test="Validate QR Code"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="Validate QR Code"; Status="FAIL"}
}

# ==============================================================================
# TEST 3: Check-In with GPS (Valid Location)
# ==============================================================================
Write-Info "`n[Test 3] POST /api/picket/check-in - GPS check-in at valid location"
try {
    $body = @{
        strikeFundId = $strikeFundId
        memberId = $member1Id
        method = "gps"
        latitude = 40.7130  # Close to picket line
        longitude = -74.0062
        deviceId = "test-device-001"
        picketLocation = $picketLocation
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/check-in" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.success) {
        $global:attendanceId1 = $response.data.attendanceId
        Write-Success "  Status: SUCCESS"
        Write-Host "  Attendance ID: $($response.data.attendanceId)"
        Write-Host "  Distance: $([math]::Round($response.data.distance))m"
        $testResults += [PSCustomObject]@{Test="GPS Check-In (Valid)"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED - $($response.error)"
        $testResults += [PSCustomObject]@{Test="GPS Check-In (Valid)"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="GPS Check-In (Valid)"; Status="FAIL"}
}

# ==============================================================================
# TEST 4: Check-In with GPS (Invalid Location - Too Far)
# ==============================================================================
Write-Info "`n[Test 4] POST /api/picket/check-in - GPS check-in too far from picket line"
try {
    $body = @{
        strikeFundId = $strikeFundId
        memberId = $member2Id
        method = "gps"
        latitude = 40.7500  # Far from picket line
        longitude = -73.9900
        deviceId = "test-device-002"
        picketLocation = $picketLocation
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/check-in" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Failure "  Status: FAILED - Should have rejected far location"
    $testResults += [PSCustomObject]@{Test="GPS Rejection (Too Far)"; Status="FAIL"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Success "  Status: SUCCESS - Correctly rejected"
        Write-Host "  Error (Expected): Location too far from picket line"
        $testResults += [PSCustomObject]@{Test="GPS Rejection (Too Far)"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED"
        Write-Failure "  Error: $($_.Exception.Message)"
        $testResults += [PSCustomObject]@{Test="GPS Rejection (Too Far)"; Status="FAIL"}
    }
}

# ==============================================================================
# TEST 5: Check-In with QR Code
# ==============================================================================
Write-Info "`n[Test 5] POST /api/picket/check-in - QR code check-in"
try {
    $body = @{
        strikeFundId = $strikeFundId
        memberId = $member2Id
        method = "qr_code"
        qrCodeData = $global:qrCode
        deviceId = "test-device-003"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/check-in" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.success) {
        $global:attendanceId2 = $response.data.attendanceId
        Write-Success "  Status: SUCCESS"
        Write-Host "  Attendance ID: $($response.data.attendanceId)"
        $testResults += [PSCustomObject]@{Test="QR Code Check-In"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED - $($response.error)"
        $testResults += [PSCustomObject]@{Test="QR Code Check-In"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="QR Code Check-In"; Status="FAIL"}
}

# ==============================================================================
# TEST 6: Get Active Check-Ins
# ==============================================================================
Write-Info "`n[Test 6] GET /api/picket/active - List active check-ins"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/active?strikeFundId=$strikeFundId" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    if ($response.success -and $response.count -ge 2) {
        Write-Success "  Status: SUCCESS"
        Write-Host "  Active Check-Ins: $($response.count)"
        $testResults += [PSCustomObject]@{Test="Get Active Check-Ins"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED - Expected at least 2 active check-ins"
        $testResults += [PSCustomObject]@{Test="Get Active Check-Ins"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="Get Active Check-Ins"; Status="FAIL"}
}

# Wait a few seconds to simulate work time
Write-Info "`n[Waiting 5 seconds to simulate picket time...]"
Start-Sleep -Seconds 5

# ==============================================================================
# TEST 7: Check-Out Member 1
# ==============================================================================
Write-Info "`n[Test 7] POST /api/picket/check-out - Check out member"
try {
    $body = @{
        attendanceId = $global:attendanceId1
        latitude = 40.7130
        longitude = -74.0062
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/check-out" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.success -and $response.data.hoursWorked) {
        Write-Success "  Status: SUCCESS"
        Write-Host "  Hours Worked: $($response.data.hoursWorked)"
        $testResults += [PSCustomObject]@{Test="Check-Out"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED"
        $testResults += [PSCustomObject]@{Test="Check-Out"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="Check-Out"; Status="FAIL"}
}

# ==============================================================================
# TEST 8: Coordinator Manual Override
# ==============================================================================
Write-Info "`n[Test 8] POST /api/picket/coordinator-override - Manual attendance entry"
try {
    $body = @{
        strikeFundId = $strikeFundId
        memberId = "55555555-5555-5555-5555-555555555555"
        hours = 8.0
        reason = "Member forgot to check in/out, verified by coordinator"
        verifiedBy = "Coordinator Smith"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/coordinator-override" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.success) {
        Write-Success "  Status: SUCCESS"
        Write-Host "  Attendance ID: $($response.data.attendanceId)"
        $testResults += [PSCustomObject]@{Test="Coordinator Override"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED"
        $testResults += [PSCustomObject]@{Test="Coordinator Override"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="Coordinator Override"; Status="FAIL"}
}

# ==============================================================================
# TEST 9: Get Attendance Summary
# ==============================================================================
Write-Info "`n[Test 9] GET /api/picket/summary - Get attendance summary"
try {
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/summary?strikeFundId=$strikeFundId&startDate=$startDate&endDate=$endDate" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    if ($response.success) {
        Write-Success "  Status: SUCCESS"
        Write-Host "  Total Members: $($response.count)"
        foreach ($member in $response.data) {
            Write-Host "    - Member: $($member.memberId)"
            Write-Host "      Hours: $($member.totalHours), Shifts: $($member.totalShifts), Avg: $($member.averageHoursPerShift)h"
        }
        $testResults += [PSCustomObject]@{Test="Attendance Summary"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED"
        $testResults += [PSCustomObject]@{Test="Attendance Summary"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="Attendance Summary"; Status="FAIL"}
}

# ==============================================================================
# TEST 10: Calculate Distance Between Two Points
# ==============================================================================
Write-Info "`n[Test 10] POST /api/picket/calculate-distance - Distance calculation"
try {
    $body = @{
        lat1 = 40.7128
        lon1 = -74.0060
        lat2 = 40.7580
        lon2 = -73.9855
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/picket/calculate-distance" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.success) {
        Write-Success "  Status: SUCCESS"
        Write-Host "  Distance: $($response.data.distanceMeters)m ($($response.data.distanceMiles)mi)"
        $testResults += [PSCustomObject]@{Test="Distance Calculation"; Status="PASS"}
    } else {
        Write-Failure "  Status: FAILED"
        $testResults += [PSCustomObject]@{Test="Distance Calculation"; Status="FAIL"}
    }
} catch {
    Write-Failure "  Status: FAILED"
    Write-Failure "  Error: $($_.Exception.Message)"
    $testResults += [PSCustomObject]@{Test="Distance Calculation"; Status="FAIL"}
}

# ==============================================================================
# TEST SUMMARY
# ==============================================================================
$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $testResults.Count

foreach ($result in $testResults) {
    if ($result.Status -eq "PASS") {
        Write-Success "PASS: $($result.Test)"
    } else {
        Write-Failure "FAIL: $($result.Test)"
    }
}

Write-Host ""
Write-Host "=== TEST SUMMARY ===" -ForegroundColor Yellow
Write-Host "Total: $totalCount tests"
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

if ($failCount -eq 0) {
    Write-Success "All picket tracking tests passed!"
} else {
    Write-Failure "Some tests failed. Check errors above."
}
