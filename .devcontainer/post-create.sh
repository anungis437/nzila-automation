#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════════╗"
echo "║   Nzila OS — DevContainer Setup          ║"
echo "╚══════════════════════════════════════════╝"

# ── 1. Install Node.js dependencies ──────────────────────────────────────────
echo "→ Installing pnpm dependencies..."
pnpm install --frozen-lockfile

# ── 2. Set up environment files ──────────────────────────────────────────────
echo "→ Setting up environment files..."
for app_dir in apps/*/; do
  app_name=$(basename "$app_dir")
  if [ -f "$app_dir/.env.example" ] && [ ! -f "$app_dir/.env.local" ]; then
    cp "$app_dir/.env.example" "$app_dir/.env.local"
    echo "  ✓ Created .env.local for $app_name"
  fi
done

# ── 3. Set up Python virtual environments for Django backends ────────────────
echo "→ Setting up Django backends..."
for backend_dir in apps/abr/backend apps/union-eyes/backend; do
  if [ -d "$backend_dir" ] && [ -f "$backend_dir/requirements.txt" ]; then
    echo "  → Installing Python deps for $(basename $(dirname $backend_dir))..."
    python3.11 -m venv "$backend_dir/.venv"
    source "$backend_dir/.venv/bin/activate"
    pip install --quiet --no-cache-dir -r "$backend_dir/requirements.txt"
    deactivate
    echo "  ✓ $(basename $(dirname $backend_dir)) backend ready"
  fi
done

# ── 4. Set up automation package (Python) ────────────────────────────────────
if [ -d "packages/automation" ] && [ -f "packages/automation/requirements.txt" ]; then
  echo "→ Setting up automation package..."
  python3.11 -m venv ".venv"
  source ".venv/bin/activate"
  pip install --quiet --no-cache-dir -r packages/automation/requirements.txt
  deactivate
  echo "  ✓ Automation package ready"
fi

# ── 5. Initialize database ──────────────────────────────────────────────────
echo "→ Waiting for PostgreSQL..."
until pg_isready -h postgres -U nzila -d nzila_dev > /dev/null 2>&1; do
  sleep 1
done
echo "  ✓ PostgreSQL is ready"

# ── 6. Run Turbo build for packages ─────────────────────────────────────────
echo "→ Building shared packages..."
pnpm turbo build --filter='./packages/*' --concurrency=50%

# ── 7. Install git hooks ────────────────────────────────────────────────────
echo "→ Installing git hooks..."
pnpm prepare

# ── 8. Verify setup ─────────────────────────────────────────────────────────
echo "→ Running verification..."
pnpm typecheck --continue 2>/dev/null && echo "  ✓ Typecheck passed" || echo "  ⚠ Typecheck had warnings (non-blocking)"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Nzila OS ready for development!     ║"
echo "║                                          ║"
echo "║   Quick commands:                        ║"
echo "║   pnpm dev          → all apps           ║"
echo "║   pnpm dev:web      → web (port 3000)    ║"
echo "║   pnpm dev:console  → console (3001)     ║"
echo "║   pnpm test         → run tests          ║"
echo "║   pnpm lint         → lint all           ║"
echo "║                                          ║"
echo "║   Jaeger UI: http://localhost:16686       ║"
echo "║   Azurite:   http://localhost:10000       ║"
echo "╚══════════════════════════════════════════╝"
