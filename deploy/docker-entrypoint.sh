#!/bin/sh
set -e

echo "=== SkipTheMid Container Starting ==="

echo "[1/3] Running Prisma migrations..."
npx prisma migrate deploy

echo "[2/3] Checking if database needs seeding..."
DISH_COUNT=$(node -e "
  const { PrismaClient } = require('./src/generated/prisma');
  const p = new PrismaClient();
  p.dish.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$DISH_COUNT" = "0" ]; then
  echo "  Database empty, running seed..."
  npx tsx prisma/seed.ts
  echo "  Seed complete."
else
  echo "  Database already seeded ($DISH_COUNT dishes), skipping."
fi

echo "[3/3] Starting Next.js server..."
exec "$@"
