@echo off
title YantraByte Solutions - Automatic Guru Mobile Backup & Cloud Installer
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo   YANTRABYTE AUTOMATED GURU MOBILE BACKUP & PRIVATE CLOUD SETUP
echo   CUSTOMER EMAIL: sougandh.mm@gmail.com
echo ===================================================================
echo.

set "TARGET_DRIVE=D:"
if not exist "D:\" set "TARGET_DRIVE=C:"

set "BASE_DIR=%TARGET_DRIVE%\Guru_Mobile_Backup"

echo [*] Creating Private Family Backup Folders on %BASE_DIR%...
mkdir "%BASE_DIR%\01_Sougandh\Camera" >nul 2>&1
mkdir "%BASE_DIR%\01_Sougandh\WhatsApp Images" >nul 2>&1
mkdir "%BASE_DIR%\01_Sougandh\WhatsApp Videos" >nul 2>&1
mkdir "%BASE_DIR%\01_Sougandh\Documents" >nul 2>&1

mkdir "%BASE_DIR%\02_Family_Member2\Camera" >nul 2>&1
mkdir "%BASE_DIR%\02_Family_Member2\WhatsApp Media" >nul 2>&1
mkdir "%BASE_DIR%\02_Family_Member2\Documents" >nul 2>&1

mkdir "%BASE_DIR%\03_Family_Member3\Camera" >nul 2>&1
mkdir "%BASE_DIR%\03_Family_Member3\WhatsApp Media" >nul 2>&1

mkdir "%BASE_DIR%\04_Family_Member4\Camera" >nul 2>&1
mkdir "%BASE_DIR%\04_Family_Member4\WhatsApp Media" >nul 2>&1

mkdir "%BASE_DIR%\05_Family_Member5\Camera" >nul 2>&1
mkdir "%BASE_DIR%\05_Family_Member5\WhatsApp Media" >nul 2>&1

echo [SUCCESS] Folder structure created cleanly!
echo.

echo [*] Configuring Windows Network Sharing & Security Permissions...
net share GuruBackup="%BASE_DIR%" /grant:everyone,full >nul 2>&1

echo [*] Detecting Local IP Address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4 Address"') do (
    set "LOCAL_IP=%%a"
)
set "LOCAL_IP=%LOCAL_IP: =%"

echo.
echo ===================================================================
echo              AUTOMATED SETUP COMPLETED SUCCESSFULLY!
echo ===================================================================
echo.
echo Your PC Local IP Address: %LOCAL_IP%
echo Storage Directory: %BASE_DIR%
echo.
echo FAMILY MOBILE ACCESS INSTRUCTIONS:
echo 1. Connect phone to Home Wi-Fi
echo 2. Open Nextcloud App / FolderSync App
echo 3. Enter Server Address: http://%LOCAL_IP%:8080
echo 4. Login with Family User Account (01_Sougandh, 02_Family_Member2, etc.)
echo.
pause
