@echo off
title YantraByte Antigravity — Automatic Background Sync Setup
color 0A
cls

echo ===================================================================
echo     YANTRABYTE SOLUTIONS — AUTOMATIC WORKSPACE SYNC INSTALLER
echo ===================================================================
echo.
echo This installer configures Windows Task Scheduler to automatically
echo sync your codebase and Nextcloud files in the background:
echo   [1] Automatically when Windows starts or user logs in.
echo   [2] Automatically every 15 minutes while working.
echo.
echo No manual Git commands or terminal steps needed ever again!
echo ===================================================================
echo.

set VBS_PATH=D:\Antigravity\Auto_Sync_Silent.vbs
if not exist "%VBS_PATH%" (
    set VBS_PATH=C:\Antigravity\Auto_Sync_Silent.vbs
)

if not exist "%VBS_PATH%" (
    echo [ERROR] Could not locate Auto_Sync_Silent.vbs script!
    echo Please make sure D:\Antigravity or C:\Antigravity exists.
    goto end
)

echo [*] Registering Task 1: Auto Sync at Logon...
schtasks /create /tn "Antigravity_AutoSync_Logon" /tr "wscript.exe %VBS_PATH%" /sc onlogon /f >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Logon task created successfully.
) else (
    echo [WARNING] Failed to create logon task (Admin rights may be needed).
)

echo [*] Registering Task 2: Auto Sync every 15 minutes...
schtasks /create /tn "Antigravity_AutoSync_15min" /tr "wscript.exe %VBS_PATH%" /sc minute /mo 15 /f >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 15-minute background sync task created successfully.
) else (
    echo [WARNING] Failed to create 15-minute task (Admin rights may be needed).
)

echo.
echo [*] Testing background sync task execution right now...
wscript.exe "%VBS_PATH%"
echo [OK] Background sync test initiated.

echo.
echo ===================================================================
echo          AUTOMATIC BACKGROUND SYNC SETUP COMPLETE!
echo ===================================================================
echo.
:end
if "%1"=="--silent" exit /b 0
pause
