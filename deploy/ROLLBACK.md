# Rollback Strategy

This document covers rollback procedures for SkipTheMid. The app runs as a single Docker container on a VPS with an SQLite database stored in a Docker volume (`sqlite-data` → `/app/data-volume/prod.db`).

## Pre-Deploy: Always Back Up the Database

Before any deploy that includes schema changes, **back up the database first**:

```bash
# SSH into the VPS
ssh deploy@<VPS_IP>

# Copy the live DB out of the Docker volume
docker compose -f ~/skipthemid/docker-compose.yml cp app:/app/data-volume/prod.db ~/backups/prod-$(date +%Y%m%d-%H%M%S).db
```

Create the backups directory once:

```bash
mkdir -p ~/backups
```

For deploys that only change code (no schema migrations), a backup is optional — the DB is untouched.

---

## Scenario 1: Full Rollback (App + Database)

**When:** A deploy broke both the app and corrupted/altered the DB in an unwanted way.

```bash
ssh deploy@<VPS_IP>

cd ~/skipthemid

# 1. Stop the running container
docker compose down

# 2. Revert code to the last known-good commit
git log --oneline -10          # find the good commit hash
git reset --hard <commit-hash>

# 3. Restore the DB backup into the volume
docker compose cp ~/backups/prod-YYYYMMDD-HHMMSS.db app:/app/data-volume/prod.db
# If container is stopped, restore via a temporary container:
docker run --rm -v skipthemid_sqlite-data:/data -v ~/backups:/backups alpine \
  cp /backups/prod-YYYYMMDD-HHMMSS.db /data/prod.db

# 4. Rebuild and restart with the old code
docker compose build
docker compose up -d

# 5. Verify
docker compose logs --tail=30
```

> **Note:** The entrypoint runs `prisma migrate deploy` on startup. Since you reverted the code, it will only apply migrations present in the old code — which match the restored DB state.

---

## Scenario 2: App-Only Rollback (Keep Database)

**When:** New code has a bug, but the DB is fine (e.g., UI regression, broken API route, bad styling).

```bash
ssh deploy@<VPS_IP>

cd ~/skipthemid

# 1. Revert to the last good commit
git log --oneline -10
git reset --hard <commit-hash>

# 2. Rebuild and restart (DB volume is untouched)
docker compose build
docker compose down && docker compose up -d

# 3. Verify
docker compose logs --tail=30
```

**Important:** This works safely when the reverted code is compatible with the current DB schema. If the deploy you're reverting added new columns (nullable), the old code simply ignores them — no issues. If the deploy renamed/dropped columns, you also need a DB rollback (Scenario 1).

---

## Scenario 3: DB-Only Rollback (Keep Current Code)

**When:** A seed script or migration corrupted data, but the app code is correct.

```bash
ssh deploy@<VPS_IP>

cd ~/skipthemid

# 1. Stop the container
docker compose down

# 2. Restore the DB backup
docker run --rm -v skipthemid_sqlite-data:/data -v ~/backups:/backups alpine \
  cp /backups/prod-YYYYMMDD-HHMMSS.db /data/prod.db

# 3. Restart — entrypoint will re-apply any missing migrations and re-seed
docker compose up -d

# 4. Verify
docker compose logs --tail=30
```

> The entrypoint runs `prisma migrate deploy` which is idempotent — it only applies migrations not yet recorded in the DB. If you restore a backup from before a migration, it will re-apply that migration on startup.

---

## Scenario 4: Quick Revert via Git (No SSH Needed)

**When:** You pushed a bad commit and want to revert before deploying to prod.

```bash
# On your local machine
git revert <bad-commit-hash>
git push origin main

# Then deploy normally
ssh deploy@<VPS_IP> 'cd ~/skipthemid && ./deploy/deploy.sh'
```

This is preferred over `git reset --hard` on the server because it preserves git history.

---

## Migration Compatibility Reference

| Migration type | App-only rollback safe? | Notes |
|---|---|---|
| Add nullable column | Yes | Old code ignores new columns |
| Add required column with default | Yes | Old code ignores new columns |
| Rename column | No | Old code queries old column name |
| Drop column | No | Old code queries dropped column |
| Change column type | Maybe | Depends on SQLite type affinity |

---

## Useful Commands

```bash
# Check current container status
docker compose ps

# View recent logs
docker compose logs --tail=50

# Inspect the DB file size
docker compose exec app ls -lh /app/data-volume/prod.db

# List all backups
ls -lh ~/backups/

# Check which migrations have been applied
docker compose exec app npx prisma migrate status

# Interactive DB shell (read-only inspection)
docker compose exec app npx prisma studio
```
