#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p bin

echo "→ Building Go backend..."
(cd backend && go build -ldflags="-s -w" -o "$ROOT/bin/backend" .)
echo "  bin/backend"

echo "→ Building Next.js frontend..."
pnpm exec next build
echo "  .next/"

echo "Build complete."
