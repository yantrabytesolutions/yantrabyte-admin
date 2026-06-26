#!/bin/bash
# Sync Phone Backup from Nextcloud internal storage to K: Drive via SFTP
NEXTCLOUD_DATA="/var/lib/docker/volumes/nextcloud_nextcloud_data/_data/data/sguragha@gmail.com/files/Phone Backup"

if [ -d "$NEXTCLOUD_DATA" ]; then
    FILE_COUNT=$(ls -1q "$NEXTCLOUD_DATA" | wc -l)
    if [ "$FILE_COUNT" -gt 0 ]; then
        echo "[$(date '+%m/%d/%Y %H:%M:%S')] Found files to sync"
        docker exec --user www-data nextcloud_app php occ files:scan sguragha@gmail.com 2>/dev/null
    fi
fi
