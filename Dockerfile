# ── Stage 1: Dependencies ──────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

# NEXT_PUBLIC_ vars are baked into the client bundle at build time
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

RUN npm run build

# ── Stage 3: Production ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache su-exec

# Standalone server + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema, migrations, seed script
COPY --from=builder /app/prisma ./prisma

# Seed data files
COPY --from=builder /app/data ./data

# Full node_modules for CLI tools (prisma migrate, tsx seed)
COPY --from=deps /app/node_modules ./node_modules

# Generated Prisma client from the build step
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

# package.json needed by tsx/prisma
COPY --from=builder /app/package.json ./package.json

# Entrypoint
COPY deploy/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Volume mount point for SQLite persistence
RUN mkdir -p /app/data-volume && chown nextjs:nodejs /app/data-volume

# Entrypoint runs as root to fix volume permissions, then drops to nextjs via su-exec
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
