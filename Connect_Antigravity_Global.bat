@echo off
title YantraByte Global Remote Connect
color 0B
cls

echo ===================================================================
echo        YANTRABYTE SOLUTIONS - GLOBAL REMOTE DESKTOP CONNECT
echo ===================================================================
echo.
echo [*] Pulling latest connection credentials from GitHub...
cd /d D:\Antigravity
git pull origin main --quiet

echo [*] Starting High-Speed Direct Tunnel to Host Laptop...
start /b cloudflared.exe access tcp --hostname icq-administrative-configured-dan.trycloudflare.com --url 127.0.0.1:33891

timeout /t 3 /nobreak >nul

echo [OK] Tunnel Established!
echo [*] Launching Remote Desktop Connection...
echo.
echo Login with:
echo   Username : sys1
echo   Password : (Windows password of sys1)
echo.

mstsc.exe /v:127.0.0.1:33891

