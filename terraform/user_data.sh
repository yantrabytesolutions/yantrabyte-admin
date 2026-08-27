#!/bin/bash
set -euo pipefail

# 1. Update system packages
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y
apt-get install -y curl git nginx certbot python3-certbot-nginx unzip

# 2. Setup 2GB Swap Memory (Prevents OOM on t3.micro)
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 3. Install Node.js 20 & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 4. Create directory structure & set permissions
mkdir -p /var/www/yantrabyte/releases /var/www/yantrabyte/scripts
chown -R ubuntu:ubuntu /var/www/yantrabyte

# 5. Create default Nginx configuration
cat <<'EOF' > /etc/nginx/sites-available/yantrabyte
server {
    listen 80;
    server_name _;

    root /var/www/yantrabyte/dist;
    index index.html;

    # Frontend Single Page App routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sfn /etc/nginx/sites-available/yantrabyte /etc/nginx/sites-enabled/yantrabyte
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
