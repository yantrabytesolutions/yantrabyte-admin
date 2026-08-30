while pgrep rsync > /dev/null; do
  sleep 60
done
cd /mnt/d/Antigravity/yantrabyte-bolt/nextcloud
docker-compose up -d
echo 'Nextcloud started locally!' > success.txt
