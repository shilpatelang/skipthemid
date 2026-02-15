#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time VPS setup for SkipTheMid
# Run as the `deploy` user on the VPS.
#
# Usage:
#   chmod +x deploy/setup.sh
#   ./deploy/setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="$HOME/skipthemid"
DOMAIN="skipthemid.com"

echo "=== SkipTheMid VPS Setup ==="

# ── 1. Clone repo ────────────────────────────────────────────────────────
if [ ! -d "$APP_DIR" ]; then
  echo "[1/5] Cloning repository..."
  git clone https://github.com/mtelang/skipthemid.git "$APP_DIR"
else
  echo "[1/5] Repository already exists, pulling latest..."
  cd "$APP_DIR" && git pull origin main
fi

cd "$APP_DIR"

# ── 2. Create production env file ────────────────────────────────────────
if [ ! -f .env.production ]; then
  echo "[2/5] Creating .env.production from template..."
  cp .env.production.example .env.production
  echo ""
  echo "  ╔══════════════════════════════════════════════════════════╗"
  echo "  ║  IMPORTANT: Edit .env.production and fill in secrets!   ║"
  echo "  ║  Run: nano $APP_DIR/.env.production                     ║"
  echo "  ║  Then re-run this script.                               ║"
  echo "  ╚══════════════════════════════════════════════════════════╝"
  echo ""
  exit 0
else
  echo "[2/5] .env.production exists."
fi

# ── 3. Build Docker image ────────────────────────────────────────────────
echo "[3/5] Building Docker image (this may take a few minutes)..."
docker compose build

# ── 4. Start container ───────────────────────────────────────────────────
echo "[4/5] Starting container..."
docker compose up -d

sleep 3
if docker compose ps | grep -q "Up"; then
  echo "  Container is running."
  docker compose logs --tail=15
else
  echo "  ERROR: Container failed to start!"
  docker compose logs --tail=30
  exit 1
fi

# ── 5. Nginx config ─────────────────────────────────────────────────────
echo "[5/5] Setting up Nginx..."
sudo cp deploy/nginx.conf "/etc/nginx/sites-available/$DOMAIN"
sudo ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "  Nginx configured and reloaded."

# ── Summary ──────────────────────────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "<your-server-ip>")

echo ""
echo "════════════════════════════════════════════════════════"
echo "  SETUP COMPLETE"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "    1. Point DNS A record for $DOMAIN → $SERVER_IP"
echo "    2. Wait for DNS propagation (check: dig $DOMAIN)"
echo "    3. Run SSL setup:"
echo "       sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "    4. Verify: curl -I https://$DOMAIN"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f          # Follow logs"
echo "    docker compose ps               # Container status"
echo "    docker compose down             # Stop"
echo "    docker compose up -d            # Start"
echo ""
