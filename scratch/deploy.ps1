tar -czf dist.tar.gz dist
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

scp -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o StrictHostKeyChecking=no dist.tar.gz ubuntu@13.205.228.94:/home/ubuntu/
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

ssh -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o StrictHostKeyChecking=no ubuntu@13.205.228.94 "sudo rm -rf /var/www/yantrabyte/frontend/* ; sudo tar -xzf /home/ubuntu/dist.tar.gz -C /var/www/yantrabyte/frontend/ --strip-components=1 ; sudo chown -R www-data:www-data /var/www/yantrabyte/frontend"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

echo "Deployment successful!"
