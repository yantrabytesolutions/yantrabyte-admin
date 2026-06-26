@echo off
title Nextcloud Secure Tunnel 24/7
:loop
echo [%date% %time%] Starting SSH tunnel...
ssh -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ConnectionAttempts=3 -R 0.0.0.0:2222:localhost:22 ubuntu@13.205.228.94 -N
echo [%date% %time%] Tunnel disconnected. Reconnecting in 10 seconds...
timeout /t 10 /nobreak >nul
goto loop
