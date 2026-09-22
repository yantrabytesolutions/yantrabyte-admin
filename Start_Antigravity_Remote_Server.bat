@echo off
setlocal EnableDelayedExpansion
title Antigravity Remote Server Node
color 1F

:: Dynamic script directory detection
set SCRIPT_DIR=%~dp0

cls
echo ===================================================================
echo       YANTRABYTE SOLUTIONS — ANTIGRAVITY REMOTE SERVER NODE
echo ===================================================================
echo.
echo [*] Triggering Pre-Session Workspace Sync...

set SYNC_PS1=
if exist "%SCRIPT_DIR%Auto_Sync_Antigravity.ps1" set SYNC_PS1=%SCRIPT_DIR%Auto_Sync_Antigravity.ps1
if not defined SYNC_PS1 if exist "I:\My Drive\Antigravity\Auto_Sync_Antigravity.ps1" set SYNC_PS1=I:\My Drive\Antigravity\Auto_Sync_Antigravity.ps1
if not defined SYNC_PS1 if exist "D:\Antigravity\Auto_Sync_Antigravity.ps1" set SYNC_PS1=D:\Antigravity\Auto_Sync_Antigravity.ps1
if not defined SYNC_PS1 if exist "C:\Antigravity\Auto_Sync_Antigravity.ps1" set SYNC_PS1=C:\Antigravity\Auto_Sync_Antigravity.ps1

if defined SYNC_PS1 (
    powershell -ExecutionPolicy Bypass -File "%SYNC_PS1%"
) else (
    echo [*] Auto sync script not found, proceeding...
)

echo.
echo ===================================================================
echo [*] Starting Antigravity Server and Remote Listener Node...
echo ===================================================================
echo.
echo Your Antigravity Remote Node is active and listening for connections!
echo.
echo Remote Access Endpoints:
echo   - Local Network RDP:     mstsc.exe -^> 192.168.0.248:3389
echo   - Tailscale / VPN RDP:   mstsc.exe -^> [Your Tailscale IP]:3389
echo   - Local Web UI:          http://192.168.0.248:3000
echo   - Cloud Storage:         https://anantatechcare.com
echo.

:: Check if agy CLI is installed and launch server
where agy >nul 2>&1
if !errorlevel! equ 0 (
    echo [*] Launching Antigravity agy CLI daemon server...
    agy server --port 3000 --bind 0.0.0.0
) else (
    echo [*] Launching YantraByte Admin Node Web Server...
    if exist "%SCRIPT_DIR%yantrabyte-bolt" (
        cd /d "%SCRIPT_DIR%yantrabyte-bolt"
    ) else if exist "I:\My Drive\Antigravity\yantrabyte-bolt" (
        cd /d "I:\My Drive\Antigravity\yantrabyte-bolt"
    ) else (
        cd /d "D:\Antigravity\yantrabyte-bolt"
    )
    npm run dev
)

pause
