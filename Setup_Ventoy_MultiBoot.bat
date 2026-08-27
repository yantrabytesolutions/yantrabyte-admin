@echo off
setlocal EnableDelayedExpansion
title Yantrabyte Multi-Boot USB Updater
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo               YANTRABYTE MULTI-BOOT USB UPDATER
echo ===================================================================
echo.
echo Source ISOs Ready on D:\:
echo   1. D:\win11_ultimate_autoinstall.iso (Win 11 Pro/Home + Software + Tweaks)
echo   2. D:\yantrabyte_solution_disk_repair_tool.iso (Disk Repair + Passwords + Cloning)
echo.
echo ===================================================================
echo.
echo Please enter the drive letter of your USB drive (e.g., E or F):
set /p USB_LETTER="USB Drive Letter: "

set "USB_LETTER=%USB_LETTER:~0,1%"
set "USB_TARGET=%USB_LETTER%:\"

if not exist "%USB_TARGET%" (
    echo.
    echo [ERROR] Drive %USB_TARGET% was not found!
    echo Please plug in your USB drive and try again.
    pause
    exit /b
)

echo.
echo [*] Copying win11_ultimate_autoinstall.iso to %USB_TARGET% ...
copy /y "D:\win11_ultimate_autoinstall.iso" "%USB_TARGET%win11_ultimate_autoinstall.iso"

echo.
echo [*] Copying yantrabyte_solution_disk_repair_tool.iso to %USB_TARGET% ...
copy /y "D:\yantrabyte_solution_disk_repair_tool.iso" "%USB_TARGET%yantrabyte_solution_disk_repair_tool.iso"

echo.
echo ===================================================================
echo                   MULTI-BOOT USB UPDATE COMPLETE!
echo ===================================================================
echo.
echo Both ISOs are now loaded on drive %USB_TARGET%!
echo When you boot from this USB drive, you can select between:
echo   - Windows 11 Auto-Install (Pro & Home)
echo   - Yantrabyte Hard Disk Repair & Password Removal Tool
echo.
pause
