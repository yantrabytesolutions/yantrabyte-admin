@echo off
setlocal EnableDelayedExpansion
title Hard Disk Repair & Cloning Rescue Toolkit
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo         BOOTABLE HARD DISK REPAIR & CLONING TOOLKIT BUILDER
echo ===================================================================
echo.
echo  This tool will help you download the best FREE bootable disk 
echo  repair, SMART diagnostics, partition manager, and cloning ISOs:
echo.
echo  [1] Download Rescuezilla Bootable ISO (Best for Disk Cloning & GParted)
echo  [2] Download Hiren's BootCD PE ISO (Best for HDD Repair & SMART Health)
echo  [3] Download Standalone Portable Diagnostic Tools (CrystalDiskInfo & Victoria)
echo  [4] Exit
echo.
echo ===================================================================
set /p CHOICE="Select an option (1-4): "

if "%CHOICE%"=="1" goto DOWNLOAD_RESCUEZILLA
if "%CHOICE%"=="2" goto DOWNLOAD_HIRENS
if "%CHOICE%"=="3" goto DOWNLOAD_PORTABLE
if "%CHOICE%"=="4" exit /b
goto MENU

:DOWNLOAD_RESCUEZILLA
echo.
echo [*] Downloading Rescuezilla Bootable ISO to D:\Rescuezilla.iso...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/rescuezilla/rescuezilla/releases/download/2.5.1/rescuezilla-2.5.1-64bit.jammy.iso' -OutFile 'D:\Rescuezilla.iso' -UseBasicParsing"
echo.
echo [OK] Saved to D:\Rescuezilla.iso
echo Copy D:\Rescuezilla.iso to your Ventoy USB drive to boot it!
pause
exit /b

:DOWNLOAD_HIRENS
echo.
echo [*] Downloading Hiren's BootCD PE ISO to D:\HirensBootCD.iso...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.hirensbootcd.org/files/HBCD_PE_x64.iso' -OutFile 'D:\HirensBootCD.iso' -UseBasicParsing"
echo.
echo [OK] Saved to D:\HirensBootCD.iso
echo Copy D:\HirensBootCD.iso to your Ventoy USB drive to boot it!
pause
exit /b

:DOWNLOAD_PORTABLE
set "TOOLS_DIR=D:\DiskRepair_Tools"
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"
echo.
echo [*] Downloading CrystalDiskInfo & Victoria HDD Repair to %TOOLS_DIR%...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://zip.crystalmark.info/CrystalDiskInfo9_5_0.zip' -OutFile '%TOOLS_DIR%\CrystalDiskInfo.zip' -UseBasicParsing"
echo [OK] Downloaded to %TOOLS_DIR%.
pause
exit /b
