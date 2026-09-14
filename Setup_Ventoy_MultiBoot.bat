@echo off
setlocal EnableDelayedExpansion
title YantraByte Multi-Boot USB Updater
color 1F

cls
echo ===================================================================
echo               YANTRABYTE MULTI-BOOT USB UPDATER
echo ===================================================================
echo.
echo Source ISOs Ready on D:\:
echo   1. D:\win11_ultimate_autoinstall.iso (Win 11 Pro Auto-Install)
echo   2. D:\yantrabyte_solution_disk_repair_tool.iso (Disk Repair Suite)
echo.
echo ===================================================================
echo.

:GET_DRIVE
set "USB_LETTER="
set /p USB_LETTER="Please enter the drive letter of your USB drive (e.g., E or F): "

if "%USB_LETTER%"=="" (
    echo [ERROR] No drive letter entered. Please try again.
    goto GET_DRIVE
)

set "USB_LETTER=!USB_LETTER:~0,1!"
set "USB_TARGET=!USB_LETTER!:\"

if not exist "!USB_TARGET!" (
    echo.
    echo [ERROR] Drive !USB_TARGET! was not found!
    echo Please plug in your USB drive and try again.
    echo.
    pause
    goto END
)

echo.
set "ISO_COPIED=0"

if exist "D:\win11_ultimate_autoinstall.iso" (
    echo [*] Copying win11_ultimate_autoinstall.iso to !USB_TARGET! ...
    robocopy "D:\" "!USB_TARGET!" "win11_ultimate_autoinstall.iso" /J /R:2 /W:2
    if !errorlevel! leq 7 set "ISO_COPIED=1"
) else if exist "D:\iso file\Windows11_Custom_Unattended.iso" (
    echo [*] Copying Windows11_Custom_Unattended.iso to !USB_TARGET! ...
    robocopy "D:\iso file" "!USB_TARGET!" "Windows11_Custom_Unattended.iso" /J /R:2 /W:2
    if !errorlevel! leq 7 set "ISO_COPIED=1"
) else (
    echo [ERROR] No Windows 11 ISO found on D:\ drive!
)

echo.
if exist "D:\yantrabyte_solution_disk_repair_tool.iso" (
    echo [*] Copying yantrabyte_solution_disk_repair_tool.iso to !USB_TARGET! ...
    robocopy "D:\" "!USB_TARGET!" "yantrabyte_solution_disk_repair_tool.iso" /J /R:2 /W:2
) else (
    echo [SKIP] yantrabyte_solution_disk_repair_tool.iso not found on D:\ drive.
)

echo.
if !ISO_COPIED! equ 1 (
    echo ===================================================================
    echo                   MULTI-BOOT USB UPDATE COMPLETE!
    echo ===================================================================
    echo.
    echo Your USB drive !USB_TARGET! has been updated successfully!
    echo When you boot from this USB drive, you can select between:
    echo   - Windows 11 Auto-Install (Pro Edition)
    echo   - YantraByte Hard Disk Repair and Password Removal Tool
) else (
    echo ===================================================================
    echo                     USB COPY FAILED / INCOMPLETE
    echo ===================================================================
    echo.
    echo Please check if drive !USB_TARGET! has at least 12 GB of free space.
)

:END
echo.
echo Press any key to exit...
pause >nul
