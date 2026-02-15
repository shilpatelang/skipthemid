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
