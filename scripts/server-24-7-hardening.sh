#!/bin/bash
set -euo pipefail

echo "=== 1. Applying Linux Kernel & Memory Tuning ==="
cat <<'EOF' > /etc/sysctl.d/99-production-tuning.conf
vm.swappiness = 15
vm.vfs_cache_pressure = 50
vm.overcommit_memory = 1
net.core.somaxconn = 1024
EOF
sysctl -p /etc/sysctl.d/99-production-tuning.conf

echo "=== 2. Configuring Docker Log Rotation (Prevents Full Disks) ==="
mkdir -p /etc/docker
cat <<'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

echo "=== 3. Creating Nextcloud Auto-Boot Systemd Service ==="
cat <<'EOF' > /etc/systemd/system/nextcloud-docker.service
[Unit]
Description=Nextcloud Docker Compose Stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/nextcloud
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable nextcloud-docker.service
systemctl start nextcloud-docker.service

echo "=== 4. Creating 24/7 Self-Healing Watchdog Script ==="
mkdir -p /var/www/yantrabyte/scripts
cat <<'EOF' > /var/www/yantrabyte/scripts/watchdog.sh
#!/bin/bash
# 24/7 Auto-Healing Health Watchdog for Nextcloud, Nginx & Yantrabyte API

# 1. Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "$(date) [WATCHDOG] Nginx was down! Restarting..." >> /var/log/watchdog.log
    systemctl restart nginx
fi

# 2. Check Nextcloud Containers
if ! docker ps | grep -q nextcloud_app; then
    echo "$(date) [WATCHDOG] Nextcloud was down! Restarting..." >> /var/log/watchdog.log
    cd /home/ubuntu/nextcloud && docker compose up -d
fi

# 3. Check Yantrabyte PM2 API
if ! pm2 describe yantrabyte-invoice-api >/dev/null 2>&1; then
    echo "$(date) [WATCHDOG] PM2 API was down! Restarting..." >> /var/log/watchdog.log
    cd /var/www/yantrabyte/dist && pm2 start npm --name yantrabyte-invoice-api -- run api
fi

# 4. Check RAM & Flush Buffer if memory exceeds 92%
MEM_USED_PCT=$(free | awk '/Mem:/ {printf("%.0f", $3/$2 * 100)}')
if [ "$MEM_USED_PCT" -gt 92 ]; then
    echo "$(date) [WATCHDOG] High RAM ($MEM_USED_PCT%). Flushing page cache..." >> /var/log/watchdog.log
    sync; echo 3 > /proc/sys/vm/drop_caches
fi
EOF
chmod +x /var/www/yantrabyte/scripts/watchdog.sh

echo "=== 5. Adding Watchdog to System Crontab (Runs every 2 minutes) ==="
(crontab -l 2>/dev/null | grep -v 'watchdog.sh'; echo '*/2 * * * * /var/www/yantrabyte/scripts/watchdog.sh >/dev/null 2>&1') | crontab -

echo "=== 6. Ensuring PM2 & Certbot Auto-Renewal on Boot ==="
pm2 save
systemctl enable certbot.timer

echo "=== 7. Restarting Nextcloud Stack Cleanly ==="
cd /home/ubuntu/nextcloud
docker compose up -d

echo "=== 🎉 24/7 Hardening Completed Successfully ==="
