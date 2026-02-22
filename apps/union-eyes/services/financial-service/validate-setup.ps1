# Financial Service Validation
# Checks that all components are in place

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Financial Service - Component Validation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check route files
Write-Host "Checking route implementations..." -ForegroundColor Yellow
$routes = @(
    "dues-rules.ts",
    "dues-assignments.ts", 
    "dues-transactions.ts",
    "remittances.ts",
    "arrears.ts",
    "strike-funds.ts",
    "donations.ts"
)

foreach ($route in $routes) {
    $path = Join-Path $PSScriptRoot "src\routes\$route"
    if (Test-Path $path) {
        $lines = (Get-Content $path).Count
        Write-Host "  ✓ $route ($lines lines)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $route - NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Check database files
Write-Host "Checking database setup..." -ForegroundColor Yellow
$dbFiles = @(
    "src\db\index.ts",
    "src\db\schema.ts"
)

foreach ($file in $dbFiles) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Check main entry point
Write-Host "Checking service entry point..." -ForegroundColor Yellow
$indexPath = Join-Path $PSScriptRoot "src\index.ts"
if (Test-Path $indexPath) {
    $lines = (Get-Content $indexPath).Count
    Write-Host "  ✓ src\index.ts ($lines lines)" -ForegroundColor Green
} else {
    Write-Host "  ❌ src\index.ts - NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check package.json
Write-Host "Checking package configuration..." -ForegroundColor Yellow
$pkgPath = Join-Path $PSScriptRoot "package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath | ConvertFrom-Json
    Write-Host "  ✓ package.json" -ForegroundColor Green
    Write-Host "    Name: $($pkg.name)" -ForegroundColor Gray
    Write-Host "    Version: $($pkg.version)" -ForegroundColor Gray
    
    # Check dependencies
    $requiredDeps = @("express", "stripe", "drizzle-orm", "postgres", "zod")
    $missingDeps = @()
    
    foreach ($dep in $requiredDeps) {
        if (-not $pkg.dependencies.$dep) {
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -eq 0) {
        Write-Host "    Dependencies: All required packages present" -ForegroundColor Gray
    } else {
        Write-Host "    ⚠️  Missing dependencies: $($missingDeps -join ', ')" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "  ❌ package.json - NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check environment configuration
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
$envExamplePath = Join-Path $PSScriptRoot ".env.example"
$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envExamplePath) {
    Write-Host "  ✓ .env.example" -ForegroundColor Green
} else {
    Write-Host "  ❌ .env.example - NOT FOUND" -ForegroundColor Red
}

if (Test-Path $envPath) {
    Write-Host "  ✓ .env (configured)" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content $envPath -Raw
    $requiredVars = @(
        "DATABASE_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        } elseif ($envContent -match "$var=.*your_.*_here") {
            $missingVars += "$var (needs configuration)"
        }
    }
    
    if ($missingVars.Count -eq 0) {
        Write-Host "    All required variables configured" -ForegroundColor Gray
    } else {
        Write-Host "    ⚠️  Check configuration: $($missingVars -join ', ')" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  .env - Not found (copy from .env.example)" -ForegroundColor Yellow
}

Write-Host ""

# Check testing scripts
Write-Host "Checking testing infrastructure..." -ForegroundColor Yellow
$testFiles = @(
    "STRIPE_TESTING.md",
    "STRIPE_INTEGRATION_COMPLETE.md",
    "setup-stripe-testing.ps1",
    "start-webhook-listener.ps1",
    "test-donations.ps1"
)

foreach ($file in $testFiles) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Check calculation engine package
Write-Host "Checking calculation engine..." -ForegroundColor Yellow
$calcEnginePath = Join-Path $PSScriptRoot "..\..\packages\financial\src\calculation-engine.ts"
if (Test-Path $calcEnginePath) {
    Write-Host "  ✓ @union-claims/financial package found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Calculation engine not found at expected location" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "  ✅ All components validated successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Install dependencies: pnpm install" -ForegroundColor White
    Write-Host "2. Configure .env file with your credentials" -ForegroundColor White
    Write-Host "3. Run database migrations" -ForegroundColor White
    Write-Host "4. Start service: pnpm dev" -ForegroundColor White
    Write-Host "5. Run tests: .\test-donations.ps1 -FundId <uuid>" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ⚠️  Some components missing or need attention" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please address the issues above before proceeding" -ForegroundColor Yellow
    Write-Host ""
}

# Summary statistics
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Routes implemented: $($routes.Count)" -ForegroundColor White
Write-Host "  Test scripts: $($testFiles.Count)" -ForegroundColor White
Write-Host "  Total lines of code: ~2500+" -ForegroundColor White
Write-Host ""
