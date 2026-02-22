# Quick test of dues calculation
Write-Host "Testing Flat Rate Calculation..." -ForegroundColor Cyan

$body = @{
    memberId = "11111111-1111-1111-1111-111111111111"
    billingPeriodStart = "2025-11-01"
    billingPeriodEnd = "2025-11-30"
    grossWages = 3000.00
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3007/api/dues/transactions/calculate" -Method POST -ContentType "application/json" -Body $body
    Write-Host "SUCCESS!" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
