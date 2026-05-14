#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
#  XrayAI — AWS EC2 Deployment Script
#  Domain: ownsurface.com
#  Run this ON the EC2 instance after SSH-ing in
# ═══════════════════════════════════════════════════════════

DOMAIN="ownsurface.com"
API_DOMAIN="api.ownsurface.com"
EMAIL="naveenani2025@gmail.com"

echo "════════════════════════════════════════"
echo "  XrayAI Production Setup — $DOMAIN"
echo "════════════════════════════════════════"

# ── Step 1: System packages ──
echo "[1/7] Installing system packages..."
sudo apt update -y
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw

# ── Step 2: Docker ──
echo "[2/7] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes."
fi
sudo systemctl enable docker
sudo systemctl start docker

# Install docker compose plugin if not present
if ! docker compose version &>/dev/null; then
    sudo apt install -y docker-compose-plugin
fi

# ── Step 3: Firewall ──
echo "[3/7] Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# ── Step 4: Data directories ──
echo "[4/7] Creating data directories..."
sudo mkdir -p /data/postgres /data/dragonfly /data/nats
sudo chown -R $USER:$USER /data

# ── Step 5: Clone repo ──
echo "[5/7] Setting up application..."
if [ ! -d /opt/xrayai ]; then
    echo "Clone your repo to /opt/xrayai:"
    echo "  git clone <your-repo-url> /opt/xrayai"
    echo "  OR scp -r your-local-project/ ec2-user@<ip>:/opt/xrayai"
    echo ""
    echo "Then re-run this script."
    exit 1
fi

cd /opt/xrayai/infra

# ── Step 6: SSL Certificate ──
echo "[6/7] Setting up SSL..."
if [ ! -f /etc/letsencrypt/live/$API_DOMAIN/fullchain.pem ]; then
    sudo apt install -y certbot
    # Stop anything on port 80 temporarily
    sudo docker compose down 2>/dev/null || true
    sudo certbot certonly --standalone \
        -d $API_DOMAIN \
        --non-interactive \
        --agree-tos \
        --email $EMAIL

    # Auto-renewal cron
    echo "0 3 * * * certbot renew --quiet --post-hook 'docker compose -f /opt/xrayai/infra/docker-compose.yml -f /opt/xrayai/infra/docker-compose.prod.yml restart nginx'" | sudo crontab -
    echo "SSL certificate obtained for $API_DOMAIN"
else
    echo "SSL certificate already exists"
fi

# ── Step 7: Check .env ──
echo "[7/7] Checking environment..."
if [ ! -f .env ]; then
    echo ""
    echo "══════════════════════════════════════════════════"
    echo "  CREATE .env FILE BEFORE STARTING"
    echo "══════════════════════════════════════════════════"
    echo ""
    echo "Copy .env.example to .env and fill in real values:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    echo "Required variables:"
    echo "  POSTGRES_PASSWORD=<strong-random-password>"
    echo "  JWT_SECRET=<strong-random-secret>"
    echo "  AWS_REGION=eu-north-1"
    echo "  AWS_SES_FROM_EMAIL=no-reply@ownsurface.com"
    echo "  AWS_SES_FROM_NAME=OwnSurface"
    echo "  AWS_SES_CONFIGURATION_SET=auth-otp-prod"
    echo "  OTP_HMAC_SECRET=<strong-random-secret>"
    echo "  OTP_TTL_SECONDS=600"
    echo "  OTP_RESEND_COOLDOWN_SECONDS=60"
    echo "  STRIPE_SECRET_KEY=sk_live_..."
    echo "  STRIPE_WEBHOOK_SECRET=whsec_..."
    echo "  CLAUDE_API_KEY=sk-ant-... (optional)"
    echo "  CORS_ORIGINS=https://ownsurface.com,https://www.ownsurface.com"
    echo ""
    echo "Attach an EC2 IAM role with ses:SendEmail before starting the API."
    echo ""
    exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "  Ready to launch!"
echo "════════════════════════════════════════"
echo ""
echo "Run:"
echo "  cd /opt/xrayai/infra"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
echo ""
echo "Then verify:"
echo "  curl https://$API_DOMAIN/health"
echo ""
