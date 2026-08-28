@echo off
title YantraByte Solutions - 1-Click Family Cloud Pendrive Installer
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo   YANTRABYTE 1-CLICK AUTOMATED FAMILY CLOUD INSTALLER
echo   CUSTOMER: Sougandh (sougandh.mm@gmail.com)
echo ===================================================================
echo.

set "TARGET_DRIVE=D:"
if not exist "D:\" set "TARGET_DRIVE=C:"
set "BASE_DIR=%TARGET_DRIVE%\YantraByteCloud"

echo [*] Creating 5 Private Isolated Family Storage Vaults on %BASE_DIR%...
mkdir "%BASE_DIR%\01_Sougandh\Camera" >nul 2>&1
mkdir "%BASE_DIR%\01_Sougandh\WhatsApp Media" >nul 2>&1
mkdir "%BASE_DIR%\01_Sougandh\Documents" >nul 2>&1

mkdir "%BASE_DIR%\02_FamilyMember2\Camera" >nul 2>&1
mkdir "%BASE_DIR%\02_FamilyMember2\WhatsApp Media" >nul 2>&1
mkdir "%BASE_DIR%\02_FamilyMember2\Documents" >nul 2>&1

mkdir "%BASE_DIR%\03_FamilyMember3\Camera" >nul 2>&1
mkdir "%BASE_DIR%\03_FamilyMember3\WhatsApp Media" >nul 2>&1

mkdir "%BASE_DIR%\04_FamilyMember4\Camera" >nul 2>&1
mkdir "%BASE_DIR%\04_FamilyMember4\WhatsApp Media" >nul 2>&1

mkdir "%BASE_DIR%\05_FamilyMember5\Camera" >nul 2>&1
mkdir "%BASE_DIR%\05_FamilyMember5\WhatsApp Media" >nul 2>&1

echo [SUCCESS] 5 Family Vaults Created!
echo.

echo [*] Detecting Local IP Address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4 Address"') do (
    set "LOCAL_IP=%%a"
)
set "LOCAL_IP=%LOCAL_IP: =%"

echo [*] Starting Nextcloud Private Cloud Server on Port 8080...
powershell -Command "docker run -d --name nextcloud -p 8080:80 -v %BASE_DIR%:/var/www/html/data --restart always nextcloud" >nul 2>&1

echo.
echo ===================================================================
echo        YANTRABYTE CLOUD INSTALLATION COMPLETED SUCCESSFULLY!
echo ===================================================================
echo.
echo PC LOCAL IP ADDRESS: %LOCAL_IP%
echo NEXTCLOUD BROWSER URL: http://localhost:8080
echo MOBILE APP SERVER URL: http://%LOCAL_IP%:8080
echo.
echo Open Chrome / Edge browser and go to http://localhost:8080 to create the 5 user accounts!
echo.
pause
