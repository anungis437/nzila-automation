# Union Eyes Clerk Authentication - Configuration Complete ✓

**Status**: Django backend fully configured for Clerk authentication  
**Date**: 2026-02-17  
**Location**: `D:\APPS\nzila-union-eyes\backend\`

---

## ✅ What Was Completed

### 1. Django Settings Configuration
**File**: [`config/settings.py`](d:/APPS/nzila-union-eyes/backend/config/settings.py)

**Changes**:
- ✅ Added `ClerkAuthentication` and `ClerkAPIKeyAuthentication` to `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES`
- ✅ Added 3 Clerk middleware classes after `AuthenticationMiddleware`:
  - `auth_core.middleware.ClerkJWTMiddleware` - Attaches Clerk context to requests
  - `auth_core.middleware.OrganizationIsolationMiddleware` - Multi-tenant data scoping
  - `auth_core.middleware.AuditLogMiddleware` - Logs all authenticated requests
- ✅ Configured `CORS_ALLOW_CREDENTIALS = True` for cross-origin auth
- ✅ Added Clerk environment variables:
  - `CLERK_JWKS_URL`
  - `CLERK_SECRET_KEY`
  - `CLERK_PUBLISHABLE_KEY`
  - `CLERK_WEBHOOK_SECRET`
- ✅ Configured Redis caching for JWT verification performance:
  - Backend: `django_redis`
  - Default timeout: 3600 seconds (1 hour)
  - Key prefix: `union_eyes`

### 2. Authentication Backend
**File**: [`auth_core/authentication.py`](d:/APPS/nzila-union-eyes/backend/auth_core/authentication.py)

**Features**:
- ✅ JWT verification with PyJWT
- ✅ JWKS key rotation support (1-hour cache, 16 keys)
- ✅ Automatic user creation from JWT payload
- ✅ Profile synchronization (email, first_name, last_name)
- ✅ Organization context extraction (clerk_org_id, clerk_org_role)
- ✅ API key authentication for service accounts

### 3. Middleware Stack
**File**: [`auth_core/middleware.py`](d:/APPS/nzila-union-eyes/backend/auth_core/middleware.py)

**Components**:
- ✅ **ClerkJWTMiddleware**: Attaches `request.clerk_user_id`, `request.clerk_org_id`, `request.clerk_org_role`
- ✅ **OrganizationIsolationMiddleware**: Sets `request.organization` for multi-tenant filtering
- ✅ **AuditLogMiddleware**: Logs user, organization, method, path, status, duration, IP address

### 4. Webhook Handlers
**File**: [`auth_core/views.py`](d:/APPS/nzila-union-eyes/backend/auth_core/views.py)

**Endpoints Added**:
- ✅ `POST /api/auth_core/webhooks/clerk/` - Clerk webhook handler with HMAC signature verification
- ✅ `GET /api/auth_core/me/` - Current user profile (requires authentication)
- ✅ `GET /api/auth_core/health/` - Health check endpoint

**Webhook Events Handled**:
- ✅ `user.created` - Auto-create Django user
- ✅ `user.updated` - Sync email, first_name, last_name
- ✅ `user.deleted` - Soft-delete (set `is_active=False`)
- ✅ `organization.created` - Logging (TODO: create org model)
- ✅ `organizationMembership.created` - Logging (TODO: create membership)
- ✅ `organizationMembership.deleted` - Logging (TODO: cleanup membership)

### 5. URL Routing
**File**: [`auth_core/urls.py`](d:/APPS/nzila-union-eyes/backend/auth_core/urls.py)

**Routes**:
```python
urlpatterns = [
    path('', include(router.urls)),  # Existing viewsets (30+ endpoints)
    path('me/', views.me, name='me'),
    path('webhooks/clerk/', views.clerk_webhook, name='clerk_webhook'),
    path('health/', views.health_check, name='health_check'),
]
```

**Full Paths**:
- `GET /api/auth_core/me/` → User profile
- `POST /api/auth_core/webhooks/clerk/` → Webhook handler
- `GET /api/auth_core/health/` → Health check

### 6. Environment Configuration
**File**: [`.env`](d:/APPS/nzila-union-eyes/backend/.env) (created from template)

**Required Variables**:
```bash
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
PGDATABASE=nzila_union_eyes
PGUSER=postgres
PGPASSWORD=postgres
PGHOST=localhost
PGPORT=5432

# Clerk (get from: https://dashboard.clerk.com)
CLERK_JWKS_URL=https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Redis
REDIS_URL=redis://127.0.0.1:6379/1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 7. Dependencies
**File**: [`requirements.txt`](d:/APPS/nzila-union-eyes/backend/requirements.txt)

**Added**:
- ✅ `django-redis>=5.4.0` (for caching)

**Already Had** (verified):
- ✅ `Django>=5.1.0`
- ✅ `djangorestframework>=3.15.0`
- ✅ `django-cors-headers>=4.3.0`
- ✅ `PyJWT>=2.8.0`
- ✅ `cryptography>=41.0.7`
- ✅ `redis>=5.0.1`
- ✅ `psycopg2-binary>=2.9.9`

---

## 🚀 Next Steps

### Step 1: Get Clerk Credentials (10 minutes)
1. Go to https://dashboard.clerk.com
2. Select your Union Eyes application (or create one)
3. Copy the following from the dashboard:
   - **API Keys** → `CLERK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
   - **API Keys** → `CLERK_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)
   - **JWKS URL**: Replace `your-clerk-domain` in `.env` with your actual Clerk domain
4. Update `.env` file with these values

### Step 2: Install Dependencies (2 minutes)
```powershell
cd D:\APPS\nzila-union-eyes\backend
pip install -r requirements.txt
```

### Step 3: Start Redis (1 minute)
**Option A - Windows Redis**:
```powershell
redis-server
```

**Option B - Docker**:
```powershell
docker run -d -p 6379:6379 redis:latest
```

### Step 4: Run Django Migrations (2 minutes)
```powershell
cd D:\APPS\nzila-union-eyes\backend
python manage.py migrate
```

Expected output: `No migrations to apply` (all migrations already run)

### Step 5: Start Django Server (1 minute)
```powershell
python manage.py runserver
```

Expected output:
```
System check identified no issues (0 silenced).
February 17, 2026 - 14:30:00
Django version 5.1.x, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
```

### Step 6: Test Endpoints (5 minutes)

**Health Check** (no auth required):
```powershell
curl http://localhost:8000/api/auth_core/health/
```
Expected: `{"status":"healthy"}`

**User Profile** (requires Clerk JWT):
1. Get a JWT token from your Union Eyes frontend (check browser DevTools → Application → Local Storage)
2. Test the endpoint:
```powershell
$token = "YOUR_CLERK_JWT_HERE"
curl -H "Authorization: Bearer $token" http://localhost:8000/api/auth_core/me/
```

Expected response:
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "clerk_user_id": "user_2...",
  "organization": {
    "id": "org_2...",
    "role": "admin"
  }
}
```

### Step 7: Configure Clerk Webhook (10 minutes)
1. Go to Clerk Dashboard → **Webhooks**
2. Click **Add Endpoint**
3. **Endpoint URL**: `https://your-production-domain/api/auth_core/webhooks/clerk/`
   - For local testing: Use [ngrok](https://ngrok.com) to expose localhost
   - `ngrok http 8000` → copy the HTTPS URL + `/api/auth_core/webhooks/clerk/`
4. **Subscribe to events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
   - ✅ `organization.created`
   - ✅ `organizationMembership.created`
   - ✅ `organizationMembership.deleted`
5. **Copy webhook secret** → Add to `.env` as `CLERK_WEBHOOK_SECRET`
6. **Test webhook**: Clerk dashboard has a "Send test event" button

### Step 8: Test Webhook Locally (with ngrok)
```powershell
# Terminal 1: Start ngrok
ngrok http 8000

# Terminal 2: Start Django
cd D:\APPS\nzila-union-eyes\backend
python manage.py runserver

# Terminal 3: Watch logs
python manage.py runserver --verbosity=2
```

In Clerk Dashboard → Webhooks → Your endpoint → "Send test event"

Check Django logs for:
```
INFO Received Clerk webhook: user.created
INFO Created user user_2... from Clerk webhook
```

---

## 📋 Configuration Summary

| Component | Status | File |
|-----------|--------|------|
| Authentication Backend | ✅ Installed | `auth_core/authentication.py` |
| Middleware | ✅ Configured | `auth_core/middleware.py` |
| Webhook Handlers | ✅ Added | `auth_core/views.py` |
| URL Routes | ✅ Updated | `auth_core/urls.py` |
| Django Settings | ✅ Configured | `config/settings.py` |
| Environment Variables | ✅ Template Created | `.env` |
| Dependencies | ✅ Ready | `requirements.txt` |
| Setup Guide | ✅ Created | `DJANGO_SETTINGS_GUIDE.md` |

---

## 🔍 Key Features Enabled

### Security
- ✅ **JWT Signature Verification**: PyJWT with RS256 algorithm
- ✅ **JWKS Key Rotation**: Auto-fetches public keys from Clerk (1-hour cache)
- ✅ **Webhook Signature Verification**: HMAC-SHA256 with Svix headers
- ✅ **CORS Configuration**: Credentials allowed for cross-origin requests

### Performance
- ✅ **Redis Caching**: JWT verification cached for 1 hour
- ✅ **JWKS Caching**: Public keys cached for 1 hour (16 keys max)
- ✅ **Connection Pooling**: Redis client reuses connections

### Multi-Tenancy
- ✅ **Organization Isolation**: `request.organization` set by middleware
- ✅ **Organization Context**: `clerk_org_id` and `clerk_org_role` from JWT
- ✅ **Automatic Filtering**: Use `request.organization` in querysets

### Observability
- ✅ **Audit Logging**: All authenticated requests logged (user, org, method, path, status, duration, IP)
- ✅ **Webhook Logging**: All Clerk events logged with INFO level
- ✅ **Error Logging**: Exceptions logged with stack traces

---

## 🔧 Troubleshooting

### JWT Verification Fails
**Symptom**: `401 Unauthorized` when calling `/api/auth_core/me/`

**Fixes**:
1. Check `CLERK_JWKS_URL` in `.env` matches your Clerk domain
2. Verify token is not expired: Decode at https://jwt.io
3. Check Django logs for specific error:
   ```powershell
   python manage.py runserver --verbosity=2
   ```

### Webhook Signature Invalid
**Symptom**: `401 Invalid signature` in webhook logs

**Fixes**:
1. Verify `CLERK_WEBHOOK_SECRET` in `.env` matches Clerk dashboard
2. Check webhook secret starts with `whsec_`
3. Ensure webhook payload is not modified by reverse proxy

### Redis Connection Error
**Symptom**: `django.core.cache.backends.base.InvalidCacheBackendError`

**Fixes**:
1. Start Redis server: `redis-server`
2. Check Redis URL in `.env`: `REDIS_URL=redis://127.0.0.1:6379/1`
3. Test Redis connection:
   ```powershell
   redis-cli ping
   # Should return: PONG
   ```

### CORS Errors in Frontend
**Symptom**: `Access-Control-Allow-Origin` error in browser console

**Fixes**:
1. Add frontend URL to `.env`:
   ```bash
   CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
   ```
2. Restart Django server
3. Verify `CORS_ALLOW_CREDENTIALS = True` in `settings.py`

---

## 📚 Documentation Links

- [Clerk Django Integration](https://clerk.com/docs/quickstarts/django)
- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [Django REST Framework Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [AUTH_MIGRATION_PLAN.md](d:/APPS/nzila-automation/packages/automation/data/AUTH_MIGRATION_PLAN.md)
- [AUTH_IMPLEMENTATION_SUMMARY.md](d:/APPS/nzila-automation/packages/automation/data/AUTH_IMPLEMENTATION_SUMMARY.md)

---

## ✅ Validation Checklist

Before deploying to production, verify:

- [ ] All Clerk credentials added to `.env` (SECRET_KEY, PUBLISHABLE_KEY, WEBHOOK_SECRET, JWKS_URL)
- [ ] Redis server running and accessible
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Migrations applied: `python manage.py migrate`
- [ ] Health check passes: `curl http://localhost:8000/api/auth_core/health/`
- [ ] JWT authentication works: `/api/auth_core/me/` returns user data
- [ ] Webhook configured in Clerk dashboard
- [ ] Webhook signature verification working (test event in Clerk dashboard)
- [ ] Frontend can receive JWT from Clerk
- [ ] Frontend includes JWT in `Authorization: Bearer <token>` header
- [ ] CORS configured with production frontend URL
- [ ] Django `DEBUG=False` in production `.env`
- [ ] Django `SECRET_KEY` changed from default
- [ ] `ALLOWED_HOSTS` includes production domain

---

**Status**: ✅ **READY FOR TESTING**  
**Next Action**: Get Clerk credentials from dashboard and run Step 1-6 above

