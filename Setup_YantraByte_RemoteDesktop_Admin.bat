@echo off
:: YantraByte Solutions — Remote Desktop Builder & Enabler
title YantraByte Remote Desktop Setup
color 0B
cls

echo ===================================================================
echo     YANTRABYTE SOLUTIONS — CUSTOM REMOTE DESKTOP SYSTEM BUILDER
echo ===================================================================
echo.
echo Checking for Administrator Privileges...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Requesting Administrator Privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [OK] Running with Administrator Privileges.
echo.

echo [1/4] Enabling Windows 11 Remote Desktop (RDP)...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f >nul
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" /v UserAuthentication /t REG_DWORD /d 1 /f >nul

echo [2/4] Configuring Remote Desktop Services (TermService)...
sc config TermService start= auto >nul
net start TermService >nul 2>&1

echo [3/4] Opening Windows Firewall for Remote Desktop...
netsh advfirewall firewall set rule group="remote desktop" new enable=Yes >nul

echo [4/4] Creating RDP Reverse SSH Cloud Tunnel Script...
set TUNNEL_BAT=D:\Antigravity\Start_RemoteDesktop_Tunnel.bat
(
echo @echo off
echo title YantraByte Remote Desktop Cloud Tunnel
echo echo ===================================================================
echo echo      YANTRABYTE SOLUTIONS — REMOTE DESKTOP CLOUD TUNNEL
echo echo ===================================================================
echo echo.
echo echo [*] Connecting Remote Desktop Port 3389 to Cloud Relay...
echo ssh -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o TCPKeepAlive=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=no -R 0.0.0.0:33890:localhost:3389 ubuntu@3.7.134.187 -N
) > "%TUNNEL_BAT%"

echo.
echo ===================================================================
echo          YANTRABYTE REMOTE DESKTOP SYSTEM BUILT SUCCESSFULLY!
echo ===================================================================
echo.
echo How to Connect from IIBS or any PC/Phone:
echo   1. Windows RDP: Launch 'mstsc.exe' and connect to:
echo      3.7.134.187:33890
echo.
echo   2. Username: sys1 (or yantrabyte.solutions@gmail.com)
echo      Password: Your Windows Account Password
echo ===================================================================
echo.
pause
