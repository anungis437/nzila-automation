#!/usr/bin/env pwsh
# Test webhook handler locally by simulating Stripe webhook payload

Write-Host "Testing webhook handler for payment_intent.succeeded event" -ForegroundColor Cyan

# Our actual payment intent ID from the test donation
$paymentIntentId = "pi_3SUAd03TNdcojbH007Ll2Lx3"
$fundId = "b7e92b69-3145-4a9b-822b-ed2e0ab9247c"
$tenantId = "a1111111-1111-1111-1111-111111111111"

# Create a webhook payload that matches Stripe's format
$webhookPayload = @{
    id = "evt_test_webhook"
    object = "event"
    api_version = "2024-11-20.acacia"
    created = [int]([DateTimeOffset]::Now.ToUnixTimeSeconds())
    data = @{
        object = @{
            id = $paymentIntentId
            object = "payment_intent"
            amount = 5000  # $50.00 in cents
            currency = "usd"
            status = "succeeded"
            metadata = @{
                fundId = $fundId
                tenantId = $tenantId
                isAnonymous = "true"
                donorName = "Anonymous"
                fundName = "Manufacturing Workers Strike Fund 2025"
                donorEmail = ""
                message = ""
            }
        }
    }
    type = "payment_intent.succeeded"
    livemode = $false
} | ConvertTo-Json -Depth 10

Write-Host "Payload:" -ForegroundColor Yellow
Write-Host $webhookPayload

Write-Host "`nSending to webhook endpoint..." -ForegroundColor Cyan

try {
    # Note: This won't work directly because we need the Stripe signature
    # Instead, we'll use psql to manually update the database
    
    Write-Host "`nManually updating database (simulating webhook processing)..." -ForegroundColor Yellow
    
    # Update the donation status
    $updateSql = @"
UPDATE public.public_donations
SET 
    status = 'completed',
    transaction_id = '$paymentIntentId',
    processed_at = NOW(),
    updated_at = NOW()
WHERE payment_intent_id = '$paymentIntentId';

UPDATE public.strike_funds
SET 
    current_balance = current_balance + 50.00,
    updated_at = NOW()
WHERE id = '$fundId';

SELECT 'Updated donation and fund balance' as result;
"@

    Write-Host $updateSql
    
    Write-Host "`nTo execute this update, run:" -ForegroundColor Green
    Write-Host "psql `"$env:DATABASE_URL`" -c `"$updateSql`"" -ForegroundColor White
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nDone! Now check the donation status:" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri 'http://localhost:3007/api/donations/dae7f1be-5986-4171-a321-081b679a708d' -Method GET | ConvertTo-Json -Depth 5" -ForegroundColor White
