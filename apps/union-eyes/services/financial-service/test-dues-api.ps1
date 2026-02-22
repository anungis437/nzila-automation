# Test script for Dues API endpoints
# Tests: GET /api/dues/rules, POST /api/dues/assignments

$baseUrl = "http://localhost:3007"

# Test authentication header
$headers = @{
    "Content-Type" = "application/json"
    "X-Test-User" = '{"id":"test-user","tenantId":"a1111111-1111-1111-1111-111111111111","role":"admin","permissions":["*"]}'
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Dues API Endpoints Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Test 1: GET /api/dues/rules - List all rules
# ============================================================================
Write-Host "[Test 1] GET /api/dues/rules - List all rules" -ForegroundColor Green

try {
    $rulesResult = Invoke-RestMethod -Uri "$baseUrl/api/dues/rules" `
        -Method GET `
        -Headers $headers
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Total Rules: $($rulesResult.total)" -ForegroundColor White
    
    if ($rulesResult.data.Count -gt 0) {
        Write-Host "  Rules Found:" -ForegroundColor White
        foreach ($rule in $rulesResult.data) {
            Write-Host "    - $($rule.ruleName) ($($rule.ruleCode)) - $($rule.calculationType)" -ForegroundColor Gray
        }
    }
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

# ============================================================================
# Test 2: GET /api/dues/rules?active=true - List active rules only
# ============================================================================
Write-Host "[Test 2] GET /api/dues/rules?active=true - Active rules only" -ForegroundColor Green

try {
    $activeRulesResult = Invoke-RestMethod -Uri "$baseUrl/api/dues/rules?active=true" `
        -Method GET `
        -Headers $headers
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Active Rules: $($activeRulesResult.total)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================================================
# Test 3: GET /api/dues/rules/:id - Get specific rule
# ============================================================================
Write-Host "[Test 3] GET /api/dues/rules/:id - Get specific rule" -ForegroundColor Green

# First, get a rule ID from the list
if ($rulesResult -and $rulesResult.data.Count -gt 0) {
    $testRuleId = $rulesResult.data[0].id
    
    try {
        $ruleDetail = Invoke-RestMethod -Uri "$baseUrl/api/dues/rules/$testRuleId" `
            -Method GET `
            -Headers $headers
        
        Write-Host "  Status: SUCCESS" -ForegroundColor Green
        Write-Host "  Rule: $($ruleDetail.data.ruleName)" -ForegroundColor White
        Write-Host "  Type: $($ruleDetail.data.calculationType)" -ForegroundColor White
        Write-Host "  Frequency: $($ruleDetail.data.billingFrequency)" -ForegroundColor White
        Write-Host ""
    }
    catch {
        Write-Host "  Status: FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "  Status: SKIPPED (no rules found)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Test 4: GET /api/dues/assignments - List all assignments
# ============================================================================
Write-Host "[Test 4] GET /api/dues/assignments - List all assignments" -ForegroundColor Green

try {
    $assignmentsResult = Invoke-RestMethod -Uri "$baseUrl/api/dues/assignments" `
        -Method GET `
        -Headers $headers
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Total Assignments: $($assignmentsResult.total)" -ForegroundColor White
    
    if ($assignmentsResult.data.Count -gt 0) {
        Write-Host "  Sample Assignments:" -ForegroundColor White
        $sample = $assignmentsResult.data | Select-Object -First 3
        foreach ($assignment in $sample) {
            $ruleName = if ($assignment.rule) { $assignment.rule.ruleName } else { "N/A" }
            Write-Host "    - Member: $($assignment.assignment.memberId.Substring(0,8))... -> Rule: $ruleName" -ForegroundColor Gray
        }
    }
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

# ============================================================================
# Test 5: GET /api/dues/assignments?active=true - Active assignments only
# ============================================================================
Write-Host "[Test 5] GET /api/dues/assignments?active=true - Active assignments" -ForegroundColor Green

try {
    $activeAssignmentsResult = Invoke-RestMethod -Uri "$baseUrl/api/dues/assignments?active=true" `
        -Method GET `
        -Headers $headers
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Active Assignments: $($activeAssignmentsResult.total)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================================================
# Test 6: POST /api/dues/assignments - Create new assignment
# ============================================================================
Write-Host "[Test 6] POST /api/dues/assignments - Create new assignment" -ForegroundColor Green

# Create a test assignment (will use first available rule)
if ($rulesResult -and $rulesResult.data.Count -gt 0) {
    $testRuleId = $rulesResult.data[0].id
    
    $newAssignmentBody = @{
        memberId = "d4444444-4444-4444-4444-444444444444"
        ruleId = $testRuleId
        effectiveDate = "2025-12-01"
        overrideAmount = 50.00
        overrideReason = "Test assignment from API"
    } | ConvertTo-Json
    
    try {
        $newAssignment = Invoke-RestMethod -Uri "$baseUrl/api/dues/assignments" `
            -Method POST `
            -ContentType "application/json" `
            -Headers $headers `
            -Body $newAssignmentBody
        
        Write-Host "  Status: SUCCESS" -ForegroundColor Green
        Write-Host "  Assignment ID: $($newAssignment.data.id)" -ForegroundColor White
        Write-Host "  Member ID: $($newAssignment.data.memberId.Substring(0,8))..." -ForegroundColor White
        Write-Host "  Rule ID: $($newAssignment.data.ruleId.Substring(0,8))..." -ForegroundColor White
        Write-Host "  Override Amount: `$$($newAssignment.data.overrideAmount)" -ForegroundColor White
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
} else {
    Write-Host "  Status: SKIPPED (no rules found)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Test 7: GET /api/dues/assignments?memberId=... - Filter by member
# ============================================================================
Write-Host "[Test 7] GET /api/dues/assignments?memberId=... - Filter by member" -ForegroundColor Green

$testMemberId = "c1111111-1111-1111-1111-111111111111"

try {
    $memberAssignments = Invoke-RestMethod -Uri "$baseUrl/api/dues/assignments?memberId=$testMemberId" `
        -Method GET `
        -Headers $headers
    
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    Write-Host "  Assignments for Member: $($memberAssignments.total)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
