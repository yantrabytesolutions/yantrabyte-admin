#!/bin/bash
# ==============================================================================
# 🧹 YantraByte Automated 24/7 Self-Healing Disk Maintenance
# Cleans:
#  - Puppeteer & Chromium temporary cache files (/tmp/org.chromium.*)
#  - Docker dangling images, unused networks, and build caches
#  - Old systemd journal logs (vacuums logs older than 2 days)
#  - Apt cache and unneeded packages (apt-get clean, autoremove)
#  - Old web releases (keeps only last 2 releases in /var/www/yantrabyte/releases)
#  - Any accidental duplicate swapfiles (ensures only 1 active /swapfile)
# ==============================================================================

set -uo pipefail

LOG_FILE="/var/log/disk-cleanup.log"
echo "=== [$(date)] Starting Automated Disk Cleanup ===" >> "$LOG_FILE"

# 1. Clean temporary Chromium/Puppeteer files & npm cache
rm -rf /tmp/org.chromium.* /tmp/puppeteer* /tmp/.org.chromium.* 2>/dev/null || true
rm -rf /root/.cache/puppeteer /home/ubuntu/.cache/puppeteer 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# 2. Clean systemd journal logs
journalctl --vacuum-time=2d --vacuum-size=50M >> "$LOG_FILE" 2>&1 || true

# 3. Clean APT cache
apt-get clean >> "$LOG_FILE" 2>&1 || true
apt-get autoremove -y >> "$LOG_FILE" 2>&1 || true

# 4. Prune Docker unused containers, images, and builder caches
docker system prune -f --filter "until=72h" >> "$LOG_FILE" 2>&1 || true
docker image prune -a -f --filter "until=168h" >> "$LOG_FILE" 2>&1 || true

# 5. Remove any duplicate /swapfile2 or inactive swapfiles
if [ -f /swapfile2 ]; then
    swapoff /swapfile2 2>/dev/null || true
    rm -f /swapfile2
    sed -i '/swapfile2/d' /etc/fstab || true
    echo "Removed redundant swapfile2" >> "$LOG_FILE"
fi

# 6. Prune old web releases (Keep last 2 releases)
RELEASES_DIR="/var/www/yantrabyte/releases"
if [ -d "$RELEASES_DIR" ]; then
    cd "$RELEASES_DIR"
    # Find all releases except the last 2, and remove them
    ls -dt release_* 2>/dev/null | tail -n +3 | while read -r old_release; do
        if [ -n "$old_release" ] && [ -d "$old_release" ]; then
            echo "Pruning old release: $old_release" >> "$LOG_FILE"
            rm -rf "$old_release"
        fi
    done
fi

# 7. Check current disk usage
AVAIL_GB=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
echo "=== Disk Cleanup Completed. Available Space: ${AVAIL_GB} GB ===" >> "$LOG_FILE"
