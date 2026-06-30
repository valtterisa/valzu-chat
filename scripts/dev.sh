#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BACKEND_PID=""

cleanup() {
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [[ ! -f .env ]]; then
  echo "Missing .env — run: cp .env.example .env"
  exit 1
fi

if [[ ! -f backend/.env ]]; then
  echo "Missing backend/.env — run: cp backend/.env.example backend/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source backend/.env
set +a

echo "Starting backend on :${PORT:-8080}..."
(cd backend && go run .) &
BACKEND_PID=$!

echo "Waiting for backend..."
for _ in $(seq 1 60); do
  if curl -sf "http://localhost:${PORT:-8080}/health" >/dev/null 2>&1; then
    echo "Backend ready."
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Backend exited unexpectedly."
    exit 1
  fi
  sleep 0.5
done

if ! curl -sf "http://localhost:${PORT:-8080}/health" >/dev/null 2>&1; then
  echo "Backend did not become healthy in time."
  exit 1
fi

echo "Starting frontend on :3000..."
echo "Open http://localhost:3000"
exec pnpm exec next dev
