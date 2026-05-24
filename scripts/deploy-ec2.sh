#!/bin/bash
set -euo pipefail

DIAG_LOG="/var/www/yantrabyte/deploy-diagnostic.log"
exec 2>&1 > $DIAG_LOG

echo "=== Diagnostic Log ==="
echo "Date: $(date)"
echo "User: $(whoami)"
echo "Node: $(node --version 2>&1)"
echo "NPM: $(npm --version 2>&1)"
which pm2 && echo "PM2: $(pm2 --version 2>&1)" || echo "PM2 not found"
echo "PATH: $PATH"
echo "HOME: $HOME"

BASE_DIR="/var/www/yantrabyte"
RELEASES_DIR="${BASE_DIR}/releases"
ACTIVE_LINK="${BASE_DIR}/dist"
ENV_FILE="${BASE_DIR}/.env"
USER_HOME="/home/ubuntu"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NEW_RELEASE_DIR="${RELEASES_DIR}/release_${TIMESTAMP}"
TARBALL="${USER_HOME}/app.tar.gz"

if [ ! -f "$TARBALL" ]; then echo "Tarball missing"; exit 1; fi
sudo mkdir -p "$RELEASES_DIR" "$NEW_RELEASE_DIR"
sudo tar -xzf "$TARBALL" -C "$NEW_RELEASE_DIR"

test -f "${NEW_RELEASE_DIR}/dist/service-request/index.html" || { echo "SPA fallback missing"; exit 1; }

if [ -f "$ENV_FILE" ]; then
    sudo ln -sfn "$ENV_FILE" "${NEW_RELEASE_DIR}/.env"
    echo "Linked external .env"
elif [ -f "${NEW_RELEASE_DIR}/.env" ]; then
    echo "Using bundled .env"
else
    echo "NO ENV FILE FOUND"
fi

echo "=== .env contents ==="
cat "${NEW_RELEASE_DIR}/.env" 2>/dev/null || echo "No .env file"

install_prod_dependencies() {
    if [ ! -f "${NEW_RELEASE_DIR}/package-lock.json" ]; then return; fi
    local current_dist="$(readlink -f "$ACTIVE_LINK" 2>/dev/null || true)"
    local current_release=""
    if [ -n "$current_dist" ]; then current_release="$(dirname "$current_dist")"; fi
    if [ -n "$current_release" ] && [ -d "${current_release}/node_modules" ] && [ -f "${current_release}/package-lock.json" ] && cmp -s "${current_release}/package-lock.json" "${NEW_RELEASE_DIR}/package-lock.json"; then
        echo "Reusing node_modules from $current_release"
        sudo cp -a "${current_release}/node_modules" "${NEW_RELEASE_DIR}/node_modules"
        return
    fi
    ensure_swap() {
        if swapon --show | grep -q .; then return; fi
        if [ ! -f /swapfile ]; then sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048; sudo chmod 600 /swapfile; sudo mkswap /swapfile; fi
        sudo swapon /swapfile
    }
    ensure_swap
    echo "Installing dependencies..."
    (cd "$NEW_RELEASE_DIR"; sudo npm ci --omit=dev --no-audit --no-fund --prefer-offline 2>&1)
}
install_prod_dependencies

echo "=== node_modules check ==="
ls "${NEW_RELEASE_DIR}/node_modules/.package-lock.json" 2>/dev/null && echo "node_modules installed" || echo "node_modules MISSING"
ls "${NEW_RELEASE_DIR}/node_modules/express" 2>/dev/null && echo "express OK" || echo "express MISSING"
ls "${NEW_RELEASE_DIR}/node_modules/nodemailer" 2>/dev/null && echo "nodemailer OK" || echo "nodemailer MISSING"

sudo chown -R www-data:www-data "$NEW_RELEASE_DIR"
sudo chown -h www-data:www-data "${NEW_RELEASE_DIR}/.env" 2>/dev/null || true
sudo find "$NEW_RELEASE_DIR" -type d -exec chmod 755 {} \;
sudo find "$NEW_RELEASE_DIR" -type f -exec chmod 644 {} \;

sudo ln -sfn "${NEW_RELEASE_DIR}/dist" "$ACTIVE_LINK"

# PM2 Setup
if ! command -v pm2 >/dev/null 2>&1; then
    echo "Installing PM2..."
    sudo npm install -g pm2 2>&1
fi
which pm2 && echo "PM2 now available at $(which pm2)" || echo "PM2 STILL NOT FOUND"

cd "$NEW_RELEASE_DIR"
echo "=== Trying to start server ==="
pm2 delete yantrabyte-invoice-api 2>/dev/null || true
pm2 start node --name yantrabyte-invoice-api -- server/invoice-email-server.js 2>&1 || echo "PM2 START FAILED"
sleep 4
echo "=== PM2 Status ==="
pm2 list 2>&1 || echo "PM2 list failed"
echo "=== PM2 Logs ==="
pm2 logs yantrabyte-invoice-api --lines 20 --nostream 2>&1 || echo "No logs"
echo "=== Local curl test ==="
curl -s -o /dev/null -w "Local health status: %{http_code}\n" http://localhost:4000/api/health 2>/dev/null || echo "CURL FAILED"
pm2 save || echo "PM2 save skipped"

echo "=== Nginx ==="
sudo systemctl reload nginx 2>&1 || sudo nginx -s reload 2>&1 || echo "Nginx reload skipped"

# Prune old releases
(cd "$RELEASES_DIR"; ls -dt release_* 2>/dev/null | tail -n +4 | xargs -I {} sudo rm -rf {} 2>/dev/null || true)

echo "=== Diagnostic Complete ==="
