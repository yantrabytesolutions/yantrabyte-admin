@echo off
setlocal EnableDelayedExpansion
title YantraByte Solutions Branded Ventoy USB Updater
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo     YANTRABYTE SOLUTIONS BRANDED MULTI-BOOT USB UPDATER
echo ===================================================================
echo.
echo Source ISOs Ready on D:\:
echo   [1] D:\YantraByte_Solutions_Master_Rescue.iso (3.29 GB Rescue Suite)
echo   [2] D:\win11_ultimate_autoinstall.iso (12.6 GB Win 11 Auto-Install)
echo.
echo ===================================================================
echo.
echo Please enter the drive letter of your Ventoy USB drive (e.g., E or F):
set /p USB_LETTER="USB Drive Letter: "

set "USB_LETTER=%USB_LETTER:~0,1%"
set "USB_TARGET=%USB_LETTER%:\"
set "VENTOY_DIR=%USB_TARGET%ventoy"

if not exist "%USB_TARGET%" (
    echo.
    echo [ERROR] Drive %USB_TARGET% was not found!
    echo Please plug in your USB drive and try again.
    pause
    exit /b
)

:: Create Ventoy Branding Config
echo [*] Creating YantraByte Solutions Menu Branding...
if not exist "%VENTOY_DIR%" mkdir "%VENTOY_DIR%"

(
echo {
echo     "theme": {
echo         "display_mode": "GUI",
echo         "ventoy_color": "cyan"
echo     },
echo     "menu_title": "YantraByte Solutions - Master IT Technician Suite",
echo     "control": [
echo         { "VTOY_DEFAULT_SEARCH_ROOT": "/" }
echo     ]
echo }
) > "%VENTOY_DIR%\ventoy.json"

echo [OK] YantraByte branding configured.

:: Copy ISOs to USB
echo.
if exist "D:\YantraByte_Solutions_Master_Rescue.iso" (
    echo [*] Copying YantraByte_Solutions_Master_Rescue.iso to %USB_TARGET% ...
    copy /y "D:\YantraByte_Solutions_Master_Rescue.iso" "%USB_TARGET%YantraByte_Solutions_Master_Rescue.iso"
) else (
    echo [SKIP] YantraByte_Solutions_Master_Rescue.iso not found on D:\ drive. Skipping optional rescue suite.
)

echo.
set "ISO_COPIED=0"
if exist "D:\Windows11_Custom_Unattended.iso" (
    echo [*] Copying Windows11_Custom_Unattended.iso (Pro Only + All Fixes) to %USB_TARGET% ...
    copy /y "D:\Windows11_Custom_Unattended.iso" "%USB_TARGET%Windows11_Custom_Unattended.iso"
    if !errorlevel! equ 0 set "ISO_COPIED=1"
) else if exist "D:\win11_ultimate_autoinstall.iso" (
    echo [*] Copying win11_ultimate_autoinstall.iso to %USB_TARGET% ...
    copy /y "D:\win11_ultimate_autoinstall.iso" "%USB_TARGET%win11_ultimate_autoinstall.iso"
    if !errorlevel! equ 0 set "ISO_COPIED=1"
) else (
    echo [ERROR] No Windows 11 ISO found on D:\ drive!
)

echo.
if !ISO_COPIED! equ 1 (
    echo ===================================================================
    echo            YANTRABYTE MULTI-BOOT USB UPDATED SUCCESSFULLY!
    echo ===================================================================
    echo.
    echo Your USB drive (%USB_TARGET%) has been successfully updated!
) else (
    echo ===================================================================
    echo               USB COPY FAILED / INCOMPLETE
    echo ===================================================================
    echo.
    echo Please check:
    echo 1. Ensure drive %USB_TARGET% is the main Ventoy partition (exFAT/NTFS) and NOT VTOYEFI.
    echo 2. Ensure your USB drive has at least 12 GB of free space available.
)
echo.
pause
