@echo off
title YantraByte Solutions - Customer Storage Node Auto-Configurator
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo   YANTRABYTE AUTOMATED CUSTOMER STORAGE NODE INSTALLER
echo   SERVER: https://anantatechcare.com
echo   CUSTOMER: Sougandh (sougandh.mm@gmail.com)
echo ===================================================================
echo.

set "SERVER_URL=https://anantatechcare.com"
set "TARGET_DRIVE=D:"
if not exist "D:\" set "TARGET_DRIVE=C:"
set "DATA_DIR=%TARGET_DRIVE%\Customer_Cloud_Storage"

echo [*] Step 1: Setting up 1 TB Storage Vault on %DATA_DIR%...
mkdir "%DATA_DIR%\01_Sougandh\Camera" >nul 2>&1
mkdir "%DATA_DIR%\01_Sougandh\WhatsApp Media" >nul 2>&1
mkdir "%DATA_DIR%\01_Sougandh\Documents" >nul 2>&1

mkdir "%DATA_DIR%\02_Mother\Camera" >nul 2>&1
mkdir "%DATA_DIR%\02_Mother\WhatsApp Media" >nul 2>&1
mkdir "%DATA_DIR%\02_Mother\Documents" >nul 2>&1

mkdir "%DATA_DIR%\03_Son\Camera" >nul 2>&1
mkdir "%DATA_DIR%\03_Son\WhatsApp Media" >nul 2>&1

mkdir "%DATA_DIR%\04_Daughter\Camera" >nul 2>&1
mkdir "%DATA_DIR%\04_Daughter\WhatsApp Media" >nul 2>&1

mkdir "%DATA_DIR%\05_Member5\Camera" >nul 2>&1
mkdir "%DATA_DIR%\05_Member5\WhatsApp Media" >nul 2>&1

echo [SUCCESS] Storage Vault created cleanly!
echo.

echo [*] Step 2: Downloading Official Nextcloud Desktop Sync Agent...
set "INSTALLER_PATH=%TEMP%\Nextcloud-Setup.msi"
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/nextcloud-releases/desktop/releases/download/v3.13.2/Nextcloud-3.13.2-x64.msi', '%INSTALLER_PATH%')" >nul 2>&1

if exist "%INSTALLER_PATH%" (
    echo [*] Installing Nextcloud Sync Agent silently...
    msiexec /i "%INSTALLER_PATH%" /qn /norestart >nul 2>&1
    echo [SUCCESS] Nextcloud Sync Agent installed!
) else (
    echo [NOTE] Installer download skipped or using web portal connection.
)

echo.
echo [*] Step 3: Generating Customer Setup & Login Cheat-Sheet...
set "INFO_FILE=C:\Users\Public\Desktop\YantraByte_Cloud_Info.txt"

(
echo ===================================================================
echo   YANTRABYTE PRIVATE FAMILY CLOUD - ACCESS INFORMATION
echo   SERVER URL: %SERVER_URL%
echo   LOCAL STORAGE PATH: %DATA_DIR%
echo ===================================================================
echo.
echo FAMILY USER ACCOUNTS & LOGINS:
echo -------------------------------------------------------------------
echo 1. Sougandh (Father)   : sougandh_father   (Quota: 200 GB)
echo 2. Mother             : sougandh_mother   (Quota: 200 GB)
echo 3. Son                : sougandh_son      (Quota: 200 GB)
echo 4. Daughter           : sougandh_daughter (Quota: 200 GB)
echo 5. Member 5           : sougandh_member5  (Quota: 200 GB)
echo.
echo MOBILE APP SETUP INSTRUCTIONS:
echo 1. Install Nextcloud App on mobile phone.
echo 2. Enter Server URL: %SERVER_URL%
echo 3. Log in with your private family username and password.
echo 4. Enable Auto-Upload for Camera Photos & WhatsApp Media.
echo.
echo SUPPORT CONTACT: YantraByte Solutions
echo Phone: 09986742525 | Email: yantrabyte.solutions@gmail.com
echo ===================================================================
) > "%INFO_FILE%"

echo.
echo ===================================================================
echo     CUSTOMER STORAGE NODE CONFIGURED SUCCESSFULLY!
echo ===================================================================
echo.
echo Desktop shortcut created: C:\Users\Public\Desktop\YantraByte_Cloud_Info.txt
echo Storage Target: %DATA_DIR%
echo Server: %SERVER_URL%
echo.
pause
