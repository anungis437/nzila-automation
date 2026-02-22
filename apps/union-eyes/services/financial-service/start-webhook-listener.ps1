# Start Stripe Webhook Listener
# Forwards Stripe webhook events to local development server

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Starting Stripe Webhook Listener" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if service is running
Write-Host "Checking if financial service is running on port 3007..." -ForegroundColor Yellow
$serviceCheck = Test-NetConnection -ComputerName localhost -Port 3007 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $serviceCheck) {
    Write-Host "⚠️  Financial service not detected on port 3007" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please start the service first:" -ForegroundColor White
    Write-Host "  cd services/financial-service" -ForegroundColor Gray
    Write-Host "  pnpm dev" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "✓ Service is running" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Stripe webhook listener..." -ForegroundColor Cyan
Write-Host "This will forward events to: http://localhost:3007/api/donations/webhooks/stripe" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Copy the webhook signing secret that appears below!" -ForegroundColor Yellow
Write-Host "           Update STRIPE_WEBHOOK_SECRET in your .env file" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop listening" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Start listener
stripe listen --forward-to localhost:3007/api/donations/webhooks/stripe

Write-Host ""
Write-Host "Webhook listener stopped" -ForegroundColor Yellow
