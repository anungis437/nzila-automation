# Financial Service - Stripe Testing Setup
# This script helps set up Stripe CLI for local webhook testing

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Financial Service - Stripe Testing Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is installed
Write-Host "Checking for Stripe CLI..." -ForegroundColor Yellow
$stripePath = Get-Command stripe -ErrorAction SilentlyContinue

if (-not $stripePath) {
    Write-Host "❌ Stripe CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Stripe CLI:" -ForegroundColor Yellow
    Write-Host "  Using Scoop: scoop install stripe" -ForegroundColor White
    Write-Host "  Or download: https://github.com/stripe/stripe-cli/releases" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✓ Stripe CLI found at: $($stripePath.Source)" -ForegroundColor Green
Write-Host ""

# Check Stripe CLI login status
Write-Host "Checking Stripe authentication..." -ForegroundColor Yellow
$loginStatus = stripe config --list 2>&1 | Select-String "account_id"

if (-not $loginStatus) {
    Write-Host "⚠️  Not logged in to Stripe" -ForegroundColor Yellow
    Write-Host ""
    $login = Read-Host "Would you like to login now? (y/n)"
    
    if ($login -eq "y") {
        Write-Host "Opening browser for Stripe authentication..." -ForegroundColor Cyan
        stripe login
    } else {
        Write-Host "Please run 'stripe login' before testing webhooks" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✓ Logged in to Stripe" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Instructions" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
$envPath = Join-Path $PSScriptRoot ".env"
$envExists = Test-Path $envPath

if (-not $envExists) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating .env from .env.example..." -ForegroundColor Cyan
    
    $examplePath = Join-Path $PSScriptRoot ".env.example"
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Host "✓ Created .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Update the following in .env:" -ForegroundColor Yellow
        Write-Host "  - STRIPE_SECRET_KEY (from Stripe Dashboard)" -ForegroundColor White
        Write-Host "  - STRIPE_PUBLISHABLE_KEY (from Stripe Dashboard)" -ForegroundColor White
        Write-Host "  - DATABASE_URL (your Supabase connection string)" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "Step 1: Get your Stripe test keys" -ForegroundColor Cyan
Write-Host "  → Visit: https://dashboard.stripe.com/test/apikeys" -ForegroundColor White
Write-Host "  → Copy your test Secret Key and Publishable Key" -ForegroundColor White
Write-Host "  → Update STRIPE_SECRET_KEY in .env file" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Start the financial service" -ForegroundColor Cyan
Write-Host "  → Terminal 1: cd services/financial-service" -ForegroundColor White
Write-Host "  → Terminal 1: pnpm install" -ForegroundColor White
Write-Host "  → Terminal 1: pnpm dev" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Start Stripe webhook forwarding" -ForegroundColor Cyan
Write-Host "  → Terminal 2: cd services/financial-service" -ForegroundColor White
Write-Host "  → Terminal 2: .\start-webhook-listener.ps1" -ForegroundColor White
Write-Host "  OR manually run:" -ForegroundColor White
Write-Host "  → stripe listen --forward-to localhost:3007/api/donations/webhooks/stripe" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 4: Test donations" -ForegroundColor Cyan
Write-Host "  → See STRIPE_TESTING.md for full test scenarios" -ForegroundColor White
Write-Host "  → Use test card: 4242 4242 4242 4242" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Quick Test Command" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Create a test donation:" -ForegroundColor Yellow
Write-Host @'
$donation = @{
  fundId = "your-fund-uuid"
  amount = 25.00
  donorName = "Test Donor"
  donorEmail = "test@example.com"
  isAnonymous = $false
  message = "Test donation"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3007/api/donations" `
  -Method POST `
  -ContentType "application/json" `
  -Body $donation
'@ -ForegroundColor White

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Ready to go! 🚀" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Offer to open documentation
$openDocs = Read-Host "Would you like to open the testing guide? (y/n)"
if ($openDocs -eq "y") {
    $docsPath = Join-Path $PSScriptRoot "STRIPE_TESTING.md"
    Start-Process $docsPath
}
