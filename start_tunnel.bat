@echo off
title Nextcloud Secure Tunnel
echo ========================================================
echo Connecting your PC to the AWS Nextcloud Server...
echo ========================================================
echo Please leave this window open! 
echo If you close it, your phone will not be able to backup to your 4TB drives.
echo.
echo Press Ctrl+C to stop the tunnel.
echo.
ssh -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=no -R 0.0.0.0:2222:localhost:22 ubuntu@13.205.228.94 -N
