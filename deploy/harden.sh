#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VPS Hardening Script
# Run as root on a fresh Ubuntu 22.04/24.04 VPS
#
# Usage:
#   curl -sL <your-gist-or-raw-url> | bash -s -- --user deploy --ssh-port 2222
#
# Or locally:
#   chmod +x harden.sh
#   sudo ./harden.sh --user deploy --ssh-port 2222
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Defaults ────────────────────────────────────────────────────────────────

USERNAME="deploy"
SSH_PORT="22"
PUBKEY=""

# ── Parse args ──────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case $1 in
    --user)     USERNAME="$2"; shift 2 ;;
    --ssh-port) SSH_PORT="$2"; shift 2 ;;
    --pubkey)   PUBKEY="$2";   shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Preflight checks ───────────────────────────────────────────────────────

if [[ $EUID -ne 0 ]]; then
  echo "ERROR: Run this script as root (or with sudo)."
  exit 1
fi

echo "=== VPS Hardening ==="
echo "  User:     $USERNAME"
echo "  SSH Port: $SSH_PORT"
echo ""

# ── 1. System updates ──────────────────────────────────────────────────────

echo "[1/8] Updating system packages..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  ufw fail2ban unattended-upgrades curl git htop iptables-persistent

# ── 2. Create non-root user ────────────────────────────────────────────────

echo "[2/8] Creating user '$USERNAME'..."
if id "$USERNAME" &>/dev/null; then
  echo "  User '$USERNAME' already exists, skipping."
else
  adduser --disabled-password --gecos "" "$USERNAME"
  usermod -aG sudo "$USERNAME"
  # Passwordless sudo for deploy user
  echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$USERNAME"
  chmod 440 "/etc/sudoers.d/$USERNAME"
  echo "  Created user '$USERNAME' with sudo access."
fi

# ── 3. SSH key setup ───────────────────────────────────────────────────────

echo "[3/8] Setting up SSH keys..."
USER_HOME="/home/$USERNAME"
SSH_DIR="$USER_HOME/.ssh"
mkdir -p "$SSH_DIR"

if [[ -n "$PUBKEY" ]]; then
  echo "$PUBKEY" >> "$SSH_DIR/authorized_keys"
  echo "  Added provided public key."
elif [[ -f /root/.ssh/authorized_keys ]]; then
  cp /root/.ssh/authorized_keys "$SSH_DIR/authorized_keys"
  # Strip OCI/cloud provider prefix (no-port-forwarding,...) that blocks non-root users
  if grep -q 'no-port-forwarding\|Please login as' "$SSH_DIR/authorized_keys"; then
    sed -i 's/.*ssh-/ssh-/' "$SSH_DIR/authorized_keys"
    echo "  Copied root's authorized_keys to $USERNAME (stripped cloud provider restrictions)."
  else
    echo "  Copied root's authorized_keys to $USERNAME."
  fi
else
  echo "  WARNING: No SSH key provided and none found on root."
  echo "  You must manually add a key to $SSH_DIR/authorized_keys"
  echo "  BEFORE the SSH config changes lock you out."
fi

chmod 700 "$SSH_DIR"
chmod 600 "$SSH_DIR/authorized_keys" 2>/dev/null || true
chown -R "$USERNAME:$USERNAME" "$SSH_DIR"

# ── 4. SSH hardening ───────────────────────────────────────────────────────

echo "[4/8] Hardening SSH config..."
SSHD_CONFIG="/etc/ssh/sshd_config"

# Backup original
cp "$SSHD_CONFIG" "$SSHD_CONFIG.bak.$(date +%s)"

# Apply settings (idempotent — removes old values first)
configure_sshd() {
  local key="$1" value="$2"
  # Remove any existing uncommented or commented lines for this key
  sed -i "/^#\?\s*${key}\s/d" "$SSHD_CONFIG"
  echo "$key $value" >> "$SSHD_CONFIG"
}

configure_sshd "Port"                  "$SSH_PORT"
configure_sshd "PermitRootLogin"       "no"
configure_sshd "PasswordAuthentication" "no"
configure_sshd "PubkeyAuthentication"  "yes"
configure_sshd "AuthorizedKeysFile"    ".ssh/authorized_keys"
configure_sshd "X11Forwarding"         "no"
configure_sshd "MaxAuthTries"          "3"
configure_sshd "ClientAliveInterval"   "300"
configure_sshd "ClientAliveCountMax"   "2"

echo "  SSH: port=$SSH_PORT, root=no, password=no, pubkey=yes"

# ── 4b. Remove OCI default iptables REJECT rule ─────────────────────────────
# OCI Ubuntu images ship with an iptables REJECT rule that blocks all traffic
# except SSH, preventing UFW rules from working. Remove it if present.

REMOVED=0
while iptables -L INPUT -n --line-numbers 2>/dev/null | grep -q 'REJECT.*icmp-host-prohibited'; do
  REJECT_RULE=$(iptables -L INPUT -n --line-numbers | grep 'REJECT.*icmp-host-prohibited' | head -1 | awk '{print $1}')
  iptables -D INPUT "$REJECT_RULE"
  REMOVED=$((REMOVED + 1))
done
if [[ $REMOVED -gt 0 ]]; then
  netfilter-persistent save
  echo "  Removed $REMOVED OCI default iptables REJECT rule(s)."
else
  echo "  No OCI iptables REJECT rule found, skipping."
fi

# ── 5. Firewall (UFW) ──────────────────────────────────────────────────────

echo "[5/8] Configuring firewall..."
ufw --force reset > /dev/null 2>&1
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT/tcp" comment "SSH"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw --force enable
echo "  UFW: deny incoming, allow SSH($SSH_PORT), HTTP(80), HTTPS(443)"

# ── 6. Fail2ban ────────────────────────────────────────────────────────────

echo "[6/8] Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true
port    = $SSH_PORT
maxretry = 3
bantime  = 24h
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "  Fail2ban: 3 SSH failures = 24h ban"

# ── 7. Automatic security updates ──────────────────────────────────────────

echo "[7/8] Enabling automatic security updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

echo "  Auto security updates enabled (no auto-reboot)"

# ── 8. Kernel hardening (sysctl) ───────────────────────────────────────────

echo "[8/8] Applying kernel hardening..."
cat > /etc/sysctl.d/99-hardening.conf << 'EOF'
# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Don't send ICMP redirects
net.ipv4.conf.all.send_redirects = 0

# Ignore broadcast pings
net.ipv4.icmp_echo_ignore_broadcasts = 1

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# IP spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Log suspicious packets
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Disable IP source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Shared memory hardening
kernel.randomize_va_space = 2
EOF

sysctl -p /etc/sysctl.d/99-hardening.conf > /dev/null 2>&1
echo "  Kernel: SYN flood protection, IP spoof protection, ICMP hardening"

# ── Restart SSH ─────────────────────────────────────────────────────────────

# Ubuntu uses "ssh", other distros use "sshd"
if systemctl list-units --type=service --all | grep -q 'ssh.service'; then
  systemctl restart ssh
else
  systemctl restart sshd
fi

# ── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════════════════════"
echo "  HARDENING COMPLETE"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  IMPORTANT — test before closing this session:"
echo ""
echo "    ssh -p $SSH_PORT $USERNAME@<your-server-ip>"
echo ""
echo "  What was configured:"
echo "    - User '$USERNAME' with sudo (no password)"
echo "    - SSH on port $SSH_PORT (root disabled, passwords disabled)"
echo "    - UFW firewall (SSH, HTTP, HTTPS only)"
echo "    - Fail2ban (3 SSH failures = 24h ban)"
echo "    - Automatic security updates"
echo "    - Kernel hardening (SYN flood, IP spoof, ICMP)"
echo ""
echo "  Next steps:"
echo "    1. Test SSH in a NEW terminal before closing this one"
echo "    2. Install Docker:  curl -fsSL https://get.docker.com | sh"
echo "    3. Add user to docker group:  usermod -aG docker $USERNAME"
echo "    4. Install nginx:  apt install nginx certbot python3-certbot-nginx"
echo ""
