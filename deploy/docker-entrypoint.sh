#!/bin/sh
set -e

echo "=== SkipTheMid Container Starting ==="

echo "[1/3] Running Prisma migrations..."
npx prisma migrate deploy

echo "[2/3] Running seed (upsert — safe to re-run)..."
npx tsx prisma/seed.ts

echo "[3/3] Starting Next.js server..."
exec "$@"
