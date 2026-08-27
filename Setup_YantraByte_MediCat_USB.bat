@echo off
setlocal EnableDelayedExpansion
title YantraByte Solutions MediCat-Style Rescue Environment
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo     YANTRABYTE SOLUTIONS MASTER TECHNICIAN RESCUE SUITE (MEDICAT STYLE)
echo ===================================================================
echo.
echo Built for: YantraByte Solutions IT Support ^& Server Administration
echo.
echo Ready Master ISOs on D:\:
echo   [1] D:\YantraByte_Solutions_Master_Rescue.iso (3.29 GB MediCat Rescue Suite)
echo   [2] D:\win11_ultimate_autoinstall.iso (12.6 GB Windows 11 Auto-Install)
echo.
echo ===================================================================
echo.
echo Please enter your USB drive letter (e.g., E or F):
set /p USB_LETTER="USB Drive Letter: "

set "USB_LETTER=%USB_LETTER:~0,1%"
set "USB_TARGET=%USB_LETTER%:\"

if not exist "%USB_TARGET%" (
    echo.
    echo [ERROR] USB Drive %USB_TARGET% not found!
    pause
    exit /b
)

echo.
echo [*] Installing YantraByte Master Rescue Suite to %USB_TARGET% ...
copy /y "D:\YantraByte_Solutions_Master_Rescue.iso" "%USB_TARGET%YantraByte_Solutions_Master_Rescue.iso"

echo.
echo [*] Installing Windows 11 Auto-Install ISO to %USB_TARGET% ...
copy /y "D:\win11_ultimate_autoinstall.iso" "%USB_TARGET%win11_ultimate_autoinstall.iso"

echo.
echo ===================================================================
echo            YANTRABYTE MEDICAT RESCUE USB CREATED!
echo ===================================================================
echo.
echo Your USB drive now contains the complete YantraByte MediCat Suite!
echo Booting from this USB gives you:
echo   - Hard Disk Repair, Bad Sector Remap ^& SMART Diagnostics
echo   - Windows ^& Windows Server Password Removal ^& Account Unlocker
echo   - Partition Management, RAID Recovery ^& Disk Cloning
echo   - Offline Virus, Rootkit ^& Malware Removal
echo   - Windows 11 Pro ^& Home Auto-Installer with Office 2024 ^& Chrome
echo.
pause
