#!/bin/bash

# Source secrets from server-side file (not tracked by git)
if [ -f /var/www/yantrabyte/.env.secrets ]; then
  cp /var/www/yantrabyte/.env.secrets /var/www/yantrabyte/.env
else
  echo "ERROR: /var/www/yantrabyte/.env.secrets not found. Create it with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  exit 1
fi
LATEST_RELEASE=$(ls -dt /var/www/yantrabyte/releases/release_* | head -n1)
cd "$LATEST_RELEASE"
sudo ln -sfn /var/www/yantrabyte/.env .env
sudo npm ci
sudo npm run build
