mkdir -p ~/.ssh
cp /mnt/c/Users/sys1/.ssh/yantrabyte-key.pem ~/.ssh/yantrabyte-key.pem
chmod 600 ~/.ssh/yantrabyte-key.pem
ssh -i ~/.ssh/yantrabyte-key.pem -o StrictHostKeyChecking=no ubuntu@3.7.134.187 'sudo bash -c "docker exec nextcloud_db mysqldump -u nextcloud -pNextcloudDbPass2026\! nextcloud > /home/ubuntu/nextcloud_db_dump.sql"'
scp -i ~/.ssh/yantrabyte-key.pem -o StrictHostKeyChecking=no ubuntu@3.7.134.187:/home/ubuntu/nextcloud_db_dump.sql ./nextcloud/
mkdir -p ./nextcloud/data
rsync -avz -e "ssh -i ~/.ssh/yantrabyte-key.pem -o StrictHostKeyChecking=no" --rsync-path="sudo rsync" ubuntu@3.7.134.187:/var/lib/docker/volumes/nextcloud_nextcloud_data/_data/ ./nextcloud/data/
