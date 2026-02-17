#!/bin/sh
set -e

echo "=== SkipTheMid Container Starting ==="

# Fix volume permissions (volume may be owned by root after creation)
echo "[0/3] Fixing data volume permissions..."
chown -R nextjs:nodejs /app/data-volume

# Drop to nextjs user for all remaining operations
echo "[1/3] Running Prisma migrations..."
su-exec nextjs npx prisma migrate deploy

echo "[2/3] Running seed (upsert — safe to re-run)..."
su-exec nextjs npx tsx prisma/seed.ts

echo "[3/3] Starting Next.js server..."
exec su-exec nextjs "$@"
