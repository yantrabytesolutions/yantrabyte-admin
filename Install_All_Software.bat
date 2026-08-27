@echo off
title YantraByte 1-Click Software Pack Installer
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo   YANTRABYTE SOFTWARE INSTALLER (OFFICE 2024, CHROME, ADOBE, 7-ZIP)
echo ===================================================================
echo.

set "SRC_DIR=D:\iso file"

if exist "%SRC_DIR%\7z2501-x64.exe" (
    echo [*] Installing 7-Zip 64-bit...
    start "" "%SRC_DIR%\7z2501-x64.exe" /S
)

if exist "%SRC_DIR%\ChromeStandaloneSetup64.exe" (
    echo [*] Installing Google Chrome 64-bit...
    start "" "%SRC_DIR%\ChromeStandaloneSetup64.exe" /silent /install
)

if exist "%SRC_DIR%\_igetintopc.com_AcroRdrDC1801120063_en_US.exe" (
    echo [*] Installing Adobe Acrobat Reader DC...
    start "" "%SRC_DIR%\_igetintopc.com_AcroRdrDC1801120063_en_US.exe" /sAll /rs /msi EULA_ACCEPT=YES
)

if exist "%SRC_DIR%\ProPlus2024Retail.img" (
    echo [*] Installing Microsoft Office 2024 Pro Plus Retail...
    powershell -Command "$m = Mount-DiskImage -ImagePath '%SRC_DIR%\ProPlus2024Retail.img' -PassThru; $d = ($m | Get-Volume).DriveLetter; start-process ($d + ':\Office\Setup64.exe') -Wait; Dismount-DiskImage -ImagePath '%SRC_DIR%\ProPlus2024Retail.img'"
)

echo.
echo ===================================================================
echo                ALL SOFTWARE INSTALLED SUCCESSFULLY!
echo ===================================================================
echo.
pause
