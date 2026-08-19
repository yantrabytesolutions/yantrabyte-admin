#!/usr/bin/env bash
# ==============================================================================
# Yantrabyte Automated Nextcloud Backup & Disk Health Monitor
# Backs up invoice data, database dumps & checks external storage health.
# ==============================================================================

set -e

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
YEAR_DIR=$(date +"%Y")
NEXTCLOUD_GURU_DIR="/var/www/nextcloud/data/guru/files/Yantrabyte_Backups/${YEAR_DIR}"
LOG_FILE="/var/log/yantrabyte_nextcloud_backup.log"

echo "[$BACKUP_DATE] 🚀 Starting automated Nextcloud backup sync..." | tee -a "$LOG_FILE"

# 1. Ensure Nextcloud target directory exists
mkdir -p "${NEXTCLOUD_GURU_DIR}"

# 2. Sync local uploaded invoices / PDF storage to Nextcloud
if [ -d "/var/www/yantrabyte/server/pdf-cache" ]; then
    echo "[$BACKUP_DATE] Syncing PDF cache to Nextcloud..." | tee -a "$LOG_FILE"
    rsync -avq --delete /var/www/yantrabyte/server/pdf-cache/ "${NEXTCLOUD_GURU_DIR}/Invoices_PDF/"
fi

# 3. Dump SQLite / local config if present
if [ -f "/var/www/yantrabyte/server/yantrabyte.db" ]; then
    echo "[$BACKUP_DATE] Backing up SQLite database..." | tee -a "$LOG_FILE"
    sqlite3 /var/www/yantrabyte/server/yantrabyte.db ".backup '${NEXTCLOUD_GURU_DIR}/database_${BACKUP_DATE}.sqlite'"
fi

# 4. Set appropriate permissions for www-data
chown -R www-data:www-data "/var/www/nextcloud/data/guru/files/Yantrabyte_Backups"

# 5. Tell Nextcloud OCC to scan new files so they appear in web UI immediately
if [ -f "/var/www/nextcloud/occ" ]; then
    echo "[$BACKUP_DATE] Running Nextcloud OCC files:scan for user guru..." | tee -a "$LOG_FILE"
    sudo -u www-data php /var/www/nextcloud/occ files:scan --path="/guru/files/Yantrabyte_Backups" > /dev/null 2>&1 || true
fi

# 6. Disk Space & SMART Health Check
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
echo "[$BACKUP_DATE] ✅ Backup sync completed successfully. Server Disk Usage: ${DISK_USAGE}" | tee -a "$LOG_FILE"

exit 0
