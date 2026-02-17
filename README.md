# SkipTheMid

A dish-centric food encyclopedia — explore global dishes, see where they originate on a map, find places that serve them, and rate your favorites.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** SQLite via Prisma v6
- **Auth:** NextAuth v5 (Google OAuth + credentials)
- **Maps:** Mapbox GL JS v3
- **Styling:** Tailwind CSS v4

## Getting Started

### Prerequisites

- Node.js 22+
- A Mapbox account (public + secret tokens)

### Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.local.example .env.local

# Generate Prisma client
npx prisma generate

# Run migrations and seed the database
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite file path (`file:./dev.db`) |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Client-side map rendering |
| `MAPBOX_ACCESS_TOKEN` | Server-side Mapbox API (seed script) |
| `AUTH_SECRET` | NextAuth session signing |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

## Adding New Dishes / Recipes / Places

All seed data lives in code — no admin panel or manual DB edits needed. The seed script uses `upsert`, so it's safe to re-run without duplicating data.

### What to edit

| Data | File | Format |
|------|------|--------|
| Dishes | `prisma/seed.ts` → `DISHES` array | Object with name, description, origin, cuisine, category, lat/lng, imageUrl |
| Recipes | `data/recipes.json` | Keyed by dish slug (e.g. `"adjarian-khachapuri"`) with `ingredients`, `steps`, `prepTime`, `cookTime`, `servings` |
| Places | `data/places.json` | Keyed by dish slug, each value is an array of `{name, address?, city, country, latitude, longitude}` |

Slugs are auto-generated from dish names (lowercased, special chars removed, spaces → hyphens). The recipe/place JSON keys must match these slugs.

### Test locally

```bash
npx tsx prisma/seed.ts
```

### Deploy to production

```bash
git add prisma/seed.ts data/recipes.json data/places.json
git commit -m "Add new dishes"
git push origin main

# Then deploy (SSH one-liner):
ssh deploy@<VPS_IP> 'cd ~/skipthemid && git pull origin main && docker compose build && docker compose down && docker compose up -d'
```

The container entrypoint (`deploy/docker-entrypoint.sh`) automatically runs `prisma migrate deploy` and then the seed script on every start — no manual DB steps needed on the server.

### When you also change the schema

If you add new columns or models to `prisma/schema.prisma`, generate a migration **locally** before pushing:

```bash
npx prisma migrate dev --name describe_change
```

This creates a SQL migration file in `prisma/migrations/` that gets committed alongside your code. The container entrypoint applies it automatically on next deploy.

## Troubleshooting

### Images not updating after backend changes

If dish images don't refresh on the UI after updating them:

**Option A — Clear browser cache:**

1. Open DevTools (`F12`)
2. Go to the **Application** tab
3. Click **Storage** in the left sidebar
4. Click **Clear site data**
5. Hard Refresh (`Ctrl + F5` or `Cmd + Shift + R`)

**Option B — Clear the Next.js build cache:**

```bash
rm -rf .next
npm run dev
```

## Deployment

Deployed via Docker on a single VPS with Nginx reverse proxy.

```bash
# On the VPS (as deploy user):
./deploy/setup.sh      # One-time setup
./deploy/deploy.sh     # Subsequent deploys
```

See `deploy/` for scripts:
- `harden.sh` — VPS hardening (UFW, fail2ban, SSH)
- `setup.sh` — Clone, build, start, configure Nginx
- `deploy.sh` — Pull, rebuild, restart
- `nginx.conf` — Reverse proxy config (pre-Certbot)
- `docker-entrypoint.sh` — Prisma migrations + seed on container start
