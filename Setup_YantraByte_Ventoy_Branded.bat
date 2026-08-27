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
echo [*] Copying YantraByte_Solutions_Master_Rescue.iso to %USB_TARGET% ...
copy /y "D:\YantraByte_Solutions_Master_Rescue.iso" "%USB_TARGET%YantraByte_Solutions_Master_Rescue.iso"

echo.
echo [*] Copying win11_ultimate_autoinstall.iso to %USB_TARGET% ...
copy /y "D:\win11_ultimate_autoinstall.iso" "%USB_TARGET%win11_ultimate_autoinstall.iso"

echo.
echo ===================================================================
echo            YANTRABYTE MULTI-BOOT USB UPDATED SUCCESSFULLY!
echo ===================================================================
echo.
echo Your USB drive (%USB_TARGET%) is now fully updated with:
echo   1. YantraByte_Solutions_Master_Rescue.iso
echo   2. win11_ultimate_autoinstall.iso
echo   3. Custom YantraByte Solutions Menu Branding (ventoy.json)
echo.
pause
