#!/bin/bash
# ==============================================================================
# 🚀 Yantrabyte Zero-Downtime Atomic Deployment Script
# Description: Extracts new web assets, performs permissions corrections,
#              swaps symbolic links atomically, reloads Nginx, and prunes old releases.
# ==============================================================================

set -euo pipefail

# --- CONFIGURATION ---
BASE_DIR="/var/www/yantrabyte"
RELEASES_DIR="${BASE_DIR}/releases"
ACTIVE_LINK="${BASE_DIR}/dist"
ENV_FILE="${BASE_DIR}/.env"
USER_HOME="/home/ubuntu" # Fallback if USER is not available
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NEW_RELEASE_DIR="${RELEASES_DIR}/release_${TIMESTAMP}"
TARBALL="${USER_HOME}/app.tar.gz"

echo "=== Starting deployment release_${TIMESTAMP} ==="

ensure_swap() {
    if swapon --show | grep -q .; then
        return
    fi

    echo "No swap detected. Creating a 2GB swap file for npm install..."
    if [ ! -f /swapfile ]; then
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
    fi
    sudo swapon /swapfile
}

# --- PRE-CHECKS & PREPARATION ---
if [ ! -f "$TARBALL" ]; then
    echo "❌ Error: Tarball $TARBALL not found!"
    exit 1
fi

sudo mkdir -p "$RELEASES_DIR"
sudo mkdir -p "$NEW_RELEASE_DIR"

# --- EXTRACTION ---
echo "📦 Extracting new production assets..."
sudo tar -xzf "$TARBALL" -C "$NEW_RELEASE_DIR"

if [ -f "$ENV_FILE" ]; then
    sudo ln -sfn "$ENV_FILE" "${NEW_RELEASE_DIR}/.env"
else
    echo "Runtime .env not found at $ENV_FILE. Invoice email API will not start correctly until it exists."
fi

if [ -f "${NEW_RELEASE_DIR}/package-lock.json" ]; then
    ensure_swap
    echo "Installing production Node dependencies..."
    (
        cd "$NEW_RELEASE_DIR"
        sudo npm ci --omit=dev --no-audit --no-fund
    )
fi

# --- PERMISSIONS ENFORCEMENT ---
echo "🔒 Correcting filesystem ownership and permissions..."
sudo chown -R www-data:www-data "$NEW_RELEASE_DIR"
sudo chown -h www-data:www-data "${NEW_RELEASE_DIR}/.env" 2>/dev/null || true
sudo find "$NEW_RELEASE_DIR" -type d -exec chmod 755 {} \;
sudo find "$NEW_RELEASE_DIR" -type f -exec chmod 644 {} \;

# --- ATOMIC SWAP ---
echo "🔄 Swapping active symbolic link..."
# -s: symbolic
# -f: force overwrite if it exists
# -n: treat symlink to a directory as a normal file to avoid nesting
sudo ln -sfn "${NEW_RELEASE_DIR}/dist" "$ACTIVE_LINK"

if command -v pm2 >/dev/null 2>&1; then
    cd "$NEW_RELEASE_DIR"
    if pm2 describe yantrabyte-invoice-api >/dev/null 2>&1; then
        pm2 restart yantrabyte-invoice-api --update-env
    else
        pm2 start npm --name yantrabyte-invoice-api -- run api
    fi
    pm2 save
else
    echo "PM2 is not installed. Run: sudo npm install -g pm2"
fi

# --- SERVER RELOAD ---
echo "⚡ Reloading Nginx web server..."
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
else
    echo "❌ Nginx configuration test failed! Deployment completed, but Nginx was NOT reloaded."
    exit 1
fi

# --- PRUNING OLD RELEASES ---
echo "🧹 Pruning old release folders (Keeping last 3)..."
# List directory contents sorted by time (oldest first), filter to release directories, and delete all but the last 3.
(
    cd "$RELEASES_DIR"
    ls -dt release_* 2>/dev/null | tail -n +4 | xargs -I {} sudo rm -rf {}
)

echo "=== 🎉 Deployment Completed Successfully ==="
