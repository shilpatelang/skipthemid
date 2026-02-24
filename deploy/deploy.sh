#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Repeatable deploy script for SkipTheMid
# Run as the `deploy` user on the VPS.
#
# Usage:
#   ./deploy/deploy.sh
#
# From dev machine (one-liner):
#   ssh oci-deploy-236 'cd ~/skipthemid && git pull origin main && docker compose build && docker compose down && docker compose up -d'
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="$HOME/skipthemid"
cd "$APP_DIR"

echo "=== Deploying SkipTheMid ==="

echo "[1/4] Pulling latest code..."
git pull origin main

echo "[2/4] Building Docker image..."
docker compose build

echo "[3/4] Restarting container..."
docker compose down
docker compose up -d

echo "[4/4] Verifying..."
sleep 3
if docker compose ps | grep -q "Up"; then
  echo "  Container is running."
  echo ""
  echo "  Recent logs:"
  docker compose logs --tail=20
else
  echo "  ERROR: Container failed to start!"
  docker compose logs --tail=50
  exit 1
fi

echo ""
echo "=== Deploy complete ==="
