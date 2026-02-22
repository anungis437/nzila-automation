# Quick test of analytics summary endpoint
$tenantId = '11111111-1111-1111-1111-111111111111'
$userId = '22222222-2222-2222-2222-222222222222'
$testUser = @{ 
    id = $userId
    tenantId = $tenantId
    role = 'admin'
    permissions = @('analytics:*')
} | ConvertTo-Json -Compress

$headers = @{
    'Content-Type' = 'application/json'
    'x-test-user' = $testUser
    'x-tenant-id' = $tenantId
}

$outputFile = "test-results.txt"
"Testing http://localhost:3007/api/analytics/summary at $(Get-Date)" | Out-File $outputFile

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3007/api/analytics/summary' -Method GET -Headers $headers -ErrorAction Stop
    "SUCCESS!" | Out-File $outputFile -Append
    $response | ConvertTo-Json -Depth 10 | Out-File $outputFile -Append
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File $outputFile -Append
    
    # Try to get more details
    if ($_.ErrorDetails) {
        "Error Details:" | Out-File $outputFile -Append
        $_.ErrorDetails.Message | Out-File $outputFile -Append
    }
    
    $_ | Out-File $outputFile -Append
}

"Test complete. Check $outputFile for results." | Write-Host
