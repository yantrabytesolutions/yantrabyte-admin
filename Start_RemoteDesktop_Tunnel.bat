@echo off
title YantraByte Remote Desktop Cloud Tunnel
echo ===================================================================
echo      YANTRABYTE SOLUTIONS — REMOTE DESKTOP CLOUD TUNNEL
echo ===================================================================
echo.
echo [*] Connecting Remote Desktop Port 3389 to Cloud Relay...
ssh -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o TCPKeepAlive=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=no -R 0.0.0.0:33890:localhost:3389 ubuntu@3.7.134.187 -N
