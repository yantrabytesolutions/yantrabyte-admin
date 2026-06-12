#!/bin/bash
echo 'VITE_SUPABASE_URL=https://eyajwjrafudarccvcada.supabase.co' > /var/www/yantrabyte/.env
echo 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTg0NjIsImV4cCI6MjA5NDQ5NDQ2Mn0.vQIGd5WdCfqhney2PKLImEDyF324lGmO2-3KaImIX04' >> /var/www/yantrabyte/.env
LATEST_RELEASE=$(ls -dt /var/www/yantrabyte/releases/release_* | head -n1)
cd "$LATEST_RELEASE"
sudo ln -sfn /var/www/yantrabyte/.env .env
sudo npm ci
sudo npm run build
