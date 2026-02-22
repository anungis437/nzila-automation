# Stripe Integration Testing Guide

This guide covers testing the Stripe donation integration for the financial service.

## Prerequisites

1. **Stripe Account**: Sign up at <https://stripe.com> if you don't have an account
2. **Stripe CLI**: Install from <https://stripe.com/docs/stripe-cli>
3. **Test API Keys**: Get from Stripe Dashboard → Developers → API keys

## Environment Setup

### 1. Configure Environment Variables

Create `.env` file in `services/financial-service/`:

```env
# Copy from .env.example and update these values:
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Install Stripe CLI

**Windows (PowerShell):**

```powershell
# Using Scoop
scoop install stripe

# Or download from https://github.com/stripe/stripe-cli/releases
```

**Mac/Linux:**

```bash
# Using Homebrew
brew install stripe/stripe-cli/stripe

# Or using shell script
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

### 3. Login to Stripe CLI

```powershell
stripe login
```

This will open a browser to authorize the CLI with your Stripe account.

## Testing Workflow

### Step 1: Start the Financial Service

```powershell
cd services/financial-service
pnpm install
pnpm dev
```

The service should start on `http://localhost:3007`

### Step 2: Forward Webhooks to Local Server

In a **separate terminal**:

```powershell
stripe listen --forward-to localhost:3007/api/donations/webhooks/stripe
```

This command will:

- Listen for Stripe events
- Forward them to your local webhook endpoint
- Display a webhook signing secret (starts with `whsec_`)

**Important**: Copy the webhook signing secret and update your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

Restart your service after updating the webhook secret.

### Step 3: Test Donation Flow

#### Option A: Using cURL

```powershell
# 1. Create a donation (get client secret)
$response = Invoke-RestMethod -Uri "http://localhost:3007/api/donations" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    fundId = "your-strike-fund-uuid"
    amount = 25.00
    donorName = "John Doe"
    donorEmail = "john@example.com"
    isAnonymous = $false
    message = "Solidarity forever!"
  } | ConvertTo-Json)

$clientSecret = $response.data.clientSecret
Write-Host "Client Secret: $clientSecret"

# 2. Confirm the payment using Stripe CLI
stripe payment_intents confirm $clientSecret --payment-method=pm_card_visa
```

#### Option B: Using Stripe Test Cards

Create a simple HTML test page or use the Stripe Dashboard:

**Test Card Numbers:**

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

**Card Details:**

- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Step 4: Trigger Test Webhooks

Manually trigger webhook events using Stripe CLI:

```powershell
# Trigger a successful payment
stripe trigger payment_intent.succeeded

# Trigger a failed payment
stripe trigger payment_intent.payment_failed

# Trigger a canceled payment
stripe trigger payment_intent.canceled
```

### Step 5: Verify Results

#### Check Database Records

```sql
-- View donations
SELECT * FROM public_donations 
ORDER BY created_at DESC 
LIMIT 10;

-- Check strike fund balance updates
SELECT id, name, current_balance, target_amount 
FROM strike_funds 
WHERE id = 'your-fund-id';

-- View payment status breakdown
SELECT payment_status, COUNT(*), SUM(amount) 
FROM public_donations 
GROUP BY payment_status;
```

#### Check Service Logs

The service logs will show:

- Payment intent creation
- Webhook event reception
- Payment status updates
- Balance adjustments

## Testing Scenarios

### Scenario 1: Successful Anonymous Donation

```powershell
$donation = @{
  fundId = "your-fund-uuid"
  amount = 50.00
  isAnonymous = $true
  message = "Keep fighting!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3007/api/donations" `
  -Method POST `
  -ContentType "application/json" `
  -Body $donation
```

**Expected Result:**

- Donation created with `payment_status = 'pending'`
- Stripe payment intent created
- Client secret returned
- After confirmation: status → `completed`, fund balance increased

### Scenario 2: Named Donation with Email

```powershell
$donation = @{
  fundId = "your-fund-uuid"
  amount = 100.00
  donorName = "Jane Smith"
  donorEmail = "jane@example.com"
  isAnonymous = $false
  message = "Solidarity!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3007/api/donations" `
  -Method POST `
  -ContentType "application/json" `
  -Body $donation
```

**Expected Result:**

- Donation visible in public campaign page
- Email receipt sent to donor
- Name appears in recent donations list

### Scenario 3: Payment Failure

```powershell
# After creating payment intent, use declined card
stripe payment_intents confirm $clientSecret --payment-method=pm_card_chargeDeclined
```

**Expected Result:**

- Webhook receives `payment_intent.payment_failed`
- Donation status → `failed`
- Fund balance unchanged

### Scenario 4: View Campaign Page

```powershell
Invoke-RestMethod -Uri "http://localhost:3007/api/donations/campaigns/your-fund-uuid" `
  -Method GET
```

**Expected Result:**

```json
{
  "success": true,
  "data": {
    "id": "fund-uuid",
    "name": "Strike Fund 2024",
    "goal": 100000,
    "currentBalance": 5000,
    "totalDonations": 5000,
    "donorCount": 25,
    "percentComplete": 5,
    "recentDonations": [...]
  }
}
```

## Webhook Event Reference

### Events Handled by Service

| Event | Description | Handler Action |
|-------|-------------|----------------|
| `payment_intent.succeeded` | Payment completed successfully | Update donation to `completed`, increase fund balance |
| `payment_intent.payment_failed` | Payment declined or failed | Update donation to `failed` |
| `payment_intent.canceled` | Payment canceled by user | Update donation to `cancelled` |

### Webhook Payload Example

```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 5000,
      "currency": "usd",
      "metadata": {
        "fundId": "fund-uuid",
        "fundName": "Strike Fund 2024",
        "donorName": "John Doe",
        "donorEmail": "john@example.com",
        "tenantId": "tenant-uuid"
      }
    }
  }
}
```

## Troubleshooting

### Issue: Webhook signature verification fails

**Solution:**

1. Ensure webhook secret in `.env` matches the one from `stripe listen` command
2. Restart service after updating webhook secret
3. Check that raw body parsing is enabled for webhook endpoint

### Issue: Payment intent creation fails

**Possible causes:**

- Invalid Stripe secret key (check `.env`)
- Stripe API version mismatch
- Invalid fund ID (fund doesn't exist or is inactive)

### Issue: Database updates not happening

**Check:**

1. Database connection is working (`GET /health`)
2. Webhook is actually being received (check service logs)
3. Tenant ID matches between fund and expected tenant
4. RLS policies allow updates (service using service role key)

## Production Deployment

### 1. Use Live Mode Keys

In production `.env`:

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
```

### 2. Configure Webhook in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://api.yourdomain.com/api/donations/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the webhook signing secret
6. Update production environment variables

### 3. Test Production Webhooks

```powershell
stripe listen --forward-to https://api.yourdomain.com/api/donations/webhooks/stripe --live
```

### 4. Monitor Webhook Deliveries

- Check Stripe Dashboard → Developers → Webhooks → [Your Endpoint]
- View delivery attempts, failures, and retry history
- Enable email alerts for failed deliveries

## Security Best Practices

1. **Always verify webhook signatures** - Already implemented in the code
2. **Use HTTPS in production** - Stripe requires it for webhooks
3. **Keep webhook secret secure** - Never commit to version control
4. **Implement idempotency** - Handle duplicate webhook deliveries
5. **Log all payment events** - For audit trail and debugging

## Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
